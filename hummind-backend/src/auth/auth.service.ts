import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import * as argon2 from 'argon2';
import { add } from 'date-fns';
import { randomUUID } from 'crypto';
import { Prisma, PlatformRole, UserStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { GoogleSignInDto } from './dto/google-signin.dto';
import { MailService } from 'src/mail/mail.service';
import { TotpService } from './totp.service';

type JwtPayload = {
  sub: string;
  email: string;
  role: 'ROOT' | 'MEMBER';
  scope?: 'password_change_only';
};

type AuthUser = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  passwordHash: string | null;
  platformRole: PlatformRole;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  mustChangePassword: boolean;
  status: UserStatus;
  totpEnabled: boolean;
  totpSecret: string | null;
  picture: string | null;
  googleId: string | null;
};

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client | null = null;

  private readonly publicUserSelect = {
    id: true,
    firstname: true,
    lastname: true,
    email: true,
    emailVerifiedAt: true,
    createdAt: true,
    platformRole: true,
    picture: true,
  } satisfies Prisma.UserSelect;

  private readonly authUserSelect = {
    id: true,
    firstname: true,
    lastname: true,
    email: true,
    passwordHash: true,
    platformRole: true,
    emailVerifiedAt: true,
    createdAt: true,
    picture: true,
    googleId: true,
    mustChangePassword: true,
    status: true,
    totpEnabled: true,
    totpSecret: true,
  } satisfies Prisma.UserSelect;

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private totp: TotpService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: SignUpDto) {
    const email = dto.email.toLowerCase().trim();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new BadRequestException('Adresse email deja utilisee');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        firstname: dto.firstname.trim(),
        lastname: dto.lastname.trim(),
        email,
        passwordHash,
      },
      select: this.publicUserSelect,
    });

    const verifyToken = await this.createVerificationToken(user.id);
    await this.mail.sendEmailConfirmation(user.email, verifyToken.token);

    const token = await this.issueToken({
      sub: user.id,
      email: user.email,
      role: user.platformRole,
    });

    return {
      user,
      token,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN') || '30d',
      emailVerification: {
        token: verifyToken.token,
        expiresAt: verifyToken.expiresAt,
      },
    };
  }

  async signin(dto: SignInDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: this.authUserSelect,
    });

    if (!user) throw new BadRequestException('Invalid credentials');
    if (!user.passwordHash) {
      throw new BadRequestException(
        'This account uses Google sign-in. Continue with Google.',
      );
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new BadRequestException('Invalid credentials');

    // Account state checks
    if (user.status === UserStatus.DISABLED) {
      throw new BadRequestException('Account is disabled');
    }
    if (user.status === UserStatus.BANNED) {
      throw new BadRequestException('Account is banned');
    }

    // First-login workflow: temporary password forces password change before
    // any further access. We issue a short-lived token scoped to that endpoint.
    if (user.mustChangePassword) {
      const tempToken = await this.issueToken(
        {
          sub: user.id,
          email: user.email,
          role: user.platformRole,
          scope: 'password_change_only',
        },
        '15m',
      );
      return {
        success: false,
        requiresPasswordChange: true,
        tempToken,
        message: 'Password change required before continuing.',
      };
    }

    if (!user.emailVerifiedAt) {
      const verifyToken = await this.createVerificationToken(user.id);
      await this.mail.sendEmailConfirmation(user.email, verifyToken.token);

      return {
        success: false,
        resendEmail: true,
        message: 'Email not verified. A new confirmation email has been sent.',
      };
    }

    // 2FA TOTP — bloque le login si le code est requis et absent/invalide.
    const totpCheck = await this.totp.verifyOnSignin({
      totpEnabled: user.totpEnabled,
      totpSecret: user.totpSecret,
      submittedCode: dto.totpCode,
    });
    if (totpCheck.required && !totpCheck.valid) {
      return {
        success: false,
        requiresTotp: true,
        message: dto.totpCode
          ? 'Code TOTP invalide'
          : 'Code TOTP requis (2FA activé)',
      };
    }

    return this.buildAuthSuccess(user);
  }

  /**
   * Finalise un compte créé avec un mot de passe temporaire.
   * Reçoit un tempToken (scope=password_change_only) + nouveau mdp.
   * - Vérifie que le token est valide et toujours non utilisé (mustChangePassword=true).
   * - Met à jour passwordHash, met mustChangePassword=false et status=ACTIVE si INVITED.
   * - Renvoie un JWT classique + le user → connexion automatique.
   */
  async finalize(dto: { tempToken: string; newPassword: string }) {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(dto.tempToken);
    } catch {
      throw new BadRequestException('Lien expiré ou invalide.');
    }

    if (payload.scope !== 'password_change_only') {
      throw new BadRequestException('Token incompatible avec cette opération.');
    }

    if (typeof dto.newPassword !== 'string' || dto.newPassword.length < 8) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit faire au moins 8 caractères.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: this.authUserSelect,
    });
    if (!user) throw new BadRequestException('Compte introuvable.');
    if (!user.mustChangePassword) {
      throw new BadRequestException(
        'Le mot de passe a déjà été défini pour ce compte.',
      );
    }

    const newHash = await argon2.hash(dto.newPassword);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
        // L'admin a créé le compte INVITED — on bascule en ACTIVE.
        status:
          user.status === UserStatus.INVITED
            ? UserStatus.ACTIVE
            : user.status,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      },
      select: this.authUserSelect,
    });

    return this.buildAuthSuccess(updated);
  }

  async googleSignin(dto: GoogleSignInDto) {
    const payload = await this.verifyGoogleCredential(dto.credential);
    const user = await this.resolveGoogleUser(payload);
    return this.buildAuthSuccess(user);
  }

  async confirmEmail(dto: ConfirmEmailDto) {
    const tokenRow = await this.prisma.verificationToken.findUnique({
      where: { token: dto.token },
    });
    if (!tokenRow) {
      return { success: false, message: 'Invalid token' };
    }

    if (tokenRow.expiresAt.getTime() <= Date.now()) {
      await this.prisma.verificationToken.delete({
        where: { id: tokenRow.id },
      });
      return { success: false, message: 'Token expired' };
    }

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: tokenRow.userId },
        data: { emailVerifiedAt: new Date() },
        select: { email: true, firstname: true },
      }),
      this.prisma.verificationToken.deleteMany({
        where: { userId: tokenRow.userId },
      }),
    ]);

    await this.mail.sendWelcomeEmail(updatedUser.email, updatedUser.firstname);

    return {
      success: true,
      message: 'Email confirmed. Your account is now active.',
    };
  }

  async resetPasswordRequest(dto: ResetPasswordRequestDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const reset = await this.createPasswordResetToken(user.id);
    await this.mail.sendPasswordReset(user.email, reset.token);

    return {
      message: 'If the email exists, a reset link has been sent.',
      debug: { token: reset.token, expiresAt: reset.expiresAt },
    };
  }

  async recoverPassword(dto: RecoverPasswordDto) {
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });
    if (!row) throw new BadRequestException('Invalid token');

    if (row.expiresAt.getTime() <= Date.now()) {
      await this.prisma.passwordResetToken.delete({ where: { id: row.id } });
      throw new BadRequestException('Token expired');
    }

    const newHash = await argon2.hash(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash: newHash },
      }),
      this.prisma.passwordResetToken.delete({ where: { id: row.id } }),
    ]);

    return { message: 'Password updated. Please sign in again.' };
  }

  private async buildAuthSuccess(user: AuthUser) {
    const token = await this.issueToken({
      sub: user.id,
      email: user.email,
      role: user.platformRole,
    });

    return {
      success: true,
      user: this.toPublicAuthUser(user),
      token,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN') || '30d',
    };
  }

  private toPublicAuthUser(user: AuthUser) {
    return {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
    };
  }

  private getGoogleClientId() {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID')?.trim();
    if (!clientId) {
      throw new InternalServerErrorException(
        'Google sign-in is not configured',
      );
    }
    return clientId;
  }

  private getGoogleClient() {
    if (!this.googleClient) {
      this.googleClient = new OAuth2Client(this.getGoogleClientId());
    }
    return this.googleClient;
  }

  private async verifyGoogleCredential(credential: string) {
    try {
      const ticket = await this.getGoogleClient().verifyIdToken({
        idToken: credential,
        audience: this.getGoogleClientId(),
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email || payload.email_verified !== true) {
        throw new BadRequestException('Google account could not be verified');
      }

      return payload;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Invalid Google credential');
    }
  }

  private getGoogleNames(payload: TokenPayload) {
    const firstname = payload.given_name?.trim();
    const lastname = payload.family_name?.trim();

    if (firstname && lastname) {
      return { firstname, lastname };
    }

    const fullName = payload.name?.trim();
    if (fullName) {
      const [head, ...tail] = fullName.split(/\s+/);
      return {
        firstname: head || 'Google',
        lastname: tail.join(' ') || 'User',
      };
    }

    return {
      firstname: 'Google',
      lastname: 'User',
    };
  }

  private async resolveGoogleUser(payload: TokenPayload): Promise<AuthUser> {
    const email = payload.email!.toLowerCase().trim();
    const googleId = payload.sub;
    const picture =
      typeof payload.picture === 'string' ? payload.picture : null;
    const verifiedAt = new Date();
    const names = this.getGoogleNames(payload);

    const userByGoogleId = await this.prisma.user.findUnique({
      where: { googleId },
      select: this.authUserSelect,
    });

    if (userByGoogleId) {
      const updateData: Prisma.UserUpdateInput = {};

      if (!userByGoogleId.emailVerifiedAt) {
        updateData.emailVerifiedAt = verifiedAt;
      }
      if (!userByGoogleId.picture && picture) {
        updateData.picture = picture;
      }

      if (Object.keys(updateData).length === 0) {
        return userByGoogleId;
      }

      return this.prisma.user.update({
        where: { id: userByGoogleId.id },
        data: updateData,
        select: this.authUserSelect,
      });
    }

    const userByEmail = await this.prisma.user.findUnique({
      where: { email },
      select: this.authUserSelect,
    });

    if (userByEmail) {
      if (userByEmail.googleId && userByEmail.googleId !== googleId) {
        throw new BadRequestException(
          'This email is already linked to another Google account',
        );
      }

      return this.prisma.user.update({
        where: { id: userByEmail.id },
        data: {
          googleId,
          emailVerifiedAt: userByEmail.emailVerifiedAt ?? verifiedAt,
          picture: userByEmail.picture ?? picture,
        },
        select: this.authUserSelect,
      });
    }

    const newUser = await this.prisma.user.create({
      data: {
        firstname: names.firstname,
        lastname: names.lastname,
        email,
        googleId,
        picture,
        passwordHash: '',
        emailVerifiedAt: verifiedAt,
      },
      select: this.authUserSelect,
    });

    await this.mail.sendWelcomeEmail(newUser.email, newUser.firstname);

    return newUser;
  }

  private async issueToken(payload: JwtPayload, overrideExpiresIn?: string) {
    const secret = this.config.get<string>('JWT_SECRET')!;
    const expiresIn = overrideExpiresIn ?? this.getJwtExpiresIn();
    // The jsonwebtoken types accept "number | ms.StringValue"; the union of
    // our env-resolver (number) and a possible "15m" override widens to
    // string | number which TS refuses. Cast through any for this one line.
    return this.jwt.signAsync(payload, {
      secret,
      expiresIn: expiresIn as unknown as number,
    });
  }

  private getJwtExpiresIn() {
    const raw = this.config.get<string>('JWT_EXPIRES_IN')?.trim();
    if (!raw) return 60 * 60 * 24 * 30;

    if (/^\d+$/.test(raw)) {
      return Number.parseInt(raw, 10);
    }

    const match = raw.match(/^(\d+)([smhd])$/i);
    if (!match) {
      return 60 * 60 * 24 * 30;
    }

    const value = Number.parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const multiplier = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 60 * 60 * 24,
    }[unit];

    if (!multiplier) {
      return 60 * 60 * 24 * 30;
    }

    return value * multiplier;
  }

  private async createVerificationToken(userId: string) {
    const token = randomUUID();
    const expiresAt = add(new Date(), { hours: 24 });
    return this.prisma.verificationToken.create({
      data: { userId, token, expiresAt },
      select: { token: true, expiresAt: true },
    });
  }

  private async createPasswordResetToken(userId: string) {
    const token = randomUUID();
    const expiresAt = add(new Date(), { hours: 1 });
    return this.prisma.passwordResetToken.create({
      data: { userId, token, expiresAt },
      select: { token: true, expiresAt: true },
    });
  }
}
