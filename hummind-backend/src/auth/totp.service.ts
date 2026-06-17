import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

const ISSUER = 'Hummind';

@Injectable()
export class TotpService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Démarre l'enrôlement TOTP : génère un secret + un otpauth URL +
   * un QR code en data:image/png pour affichage. Le secret est persisté
   * tout de suite côté User (mais totpEnabled reste false jusqu'à enable()).
   */
  async setup(userId: string): Promise<{ secret: string; otpauth: string; qrCode: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, totpEnabled: true },
    });
    if (!user) throw new NotFoundException('Compte introuvable');
    if (user.totpEnabled) {
      throw new BadRequestException(
        'TOTP déjà activé. Désactivez-le avant d\'en générer un nouveau.',
      );
    }

    const secret = generateSecret();
    const otpauth = generateURI({
      strategy: 'totp',
      issuer: ISSUER,
      label: user.email,
      secret,
    });
    const qrCode = await QRCode.toDataURL(otpauth);

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret, totpEnabled: false },
    });

    return { secret, otpauth, qrCode };
  }

  /**
   * Active TOTP en vérifiant un premier code généré depuis l'app authenticator.
   */
  async enable(userId: string, code: string): Promise<{ enabled: true }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, totpEnabled: true },
    });
    if (!user) throw new NotFoundException('Compte introuvable');
    if (!user.totpSecret) {
      throw new BadRequestException(
        'Aucun secret TOTP. Lancez d\'abord la procédure d\'activation.',
      );
    }
    if (user.totpEnabled) {
      return { enabled: true };
    }
    const result = verifySync({ secret: user.totpSecret, token: code });
    if (!result.valid) {
      throw new BadRequestException('Code TOTP invalide');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });
    return { enabled: true };
  }

  async disable(userId: string): Promise<{ enabled: false }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null },
    });
    return { enabled: false };
  }

  /**
   * Vérifie un code TOTP lors du signin. Renvoie { valid, required }.
   * Si l'utilisateur n'a pas TOTP activé, required=false et valid=true (passthrough).
   */
  async verifyOnSignin(args: {
    totpEnabled: boolean;
    totpSecret: string | null;
    submittedCode?: string;
  }): Promise<{ valid: boolean; required: boolean }> {
    if (!args.totpEnabled || !args.totpSecret) {
      return { valid: true, required: false };
    }
    if (!args.submittedCode) {
      return { valid: false, required: true };
    }
    const result = verifySync({
      secret: args.totpSecret,
      token: args.submittedCode,
    });
    return { valid: result.valid, required: true };
  }
}
