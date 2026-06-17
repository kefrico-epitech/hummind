import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TotpService } from './totp.service';
import { SignInDto } from './dto/signin.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { GoogleSignInDto } from './dto/google-signin.dto';
import { FinalizePasswordDto } from './dto/finalize-password.dto';
import { FastifyReply } from 'fastify';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUserId } from './current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly totp: TotpService,
  ) {}

  // ---------------------------------------------------------------------------
  // TOTP 2FA (Flow v2.0 Sprint C.3)
  // ---------------------------------------------------------------------------

  @Post('totp/setup')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  totpSetup(@CurrentUserId() userId: string) {
    return this.totp.setup(userId);
  }

  @Post('totp/enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  totpEnable(
    @CurrentUserId() userId: string,
    @Body() body: { code: string },
  ) {
    return this.totp.enable(userId, body.code);
  }

  @Post('totp/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  totpDisable(@CurrentUserId() userId: string) {
    return this.totp.disable(userId);
  }

  // Public sign-up is intentionally NOT exposed: accounts are created by ROOT
  // (after a /demo request), by an organisation OWNER/ADMIN, or via a
  // /join/[code] public salle link (handled by a dedicated controller).

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Sign in. Returns tokens, or { requiresPasswordChange, tempToken } when the user has a temporary password and must go through /first-login.',
  })
  async signin(@Body() dto: SignInDto) {
    return this.auth.signin(dto);
  }

  @Post('finalize')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Finalize an account created with a temporary password: set the definitive password and receive a normal session token.',
  })
  async finalize(@Body() dto: FinalizePasswordDto) {
    return this.auth.finalize(dto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Sign in with Google + returns tokens' })
  async googleSignin(@Body() dto: GoogleSignInDto) {
    return this.auth.googleSignin(dto);
  }

  /** Active le compte via un token reçu par email */
  @Get('confirm-email')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Confirm email and activate account' })
  async confirmEmailGet(
    @Query() dto: ConfirmEmailDto,
    @Res() res: FastifyReply,
  ) {
    const result = await this.auth.confirmEmail(dto);

    if (result.success) {
      return res.status(HttpStatus.OK).type('text/html').send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmation réussie</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: linear-gradient(135deg, #4CAF50, #2e7d32);
              color: white;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
              animation: fadeIn 0.8s ease-in-out;
            }
            h1 {
              font-size: 2.5rem;
              margin-bottom: 10px;
            }
            p {
              font-size: 1.2rem;
              margin-bottom: 20px;
            }
            a {
              display: inline-block;
              padding: 12px 24px;
              background: white;
              color: #2e7d32;
              border-radius: 25px;
              font-weight: bold;
              text-decoration: none;
              transition: 0.3s;
            }
            a:hover {
              background: #f1f1f1;
              transform: scale(1.05);
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          </style>
        </head>
        <body>
          <h1>✅ Email confirmé !</h1>
          <p>Votre compte est maintenant actif.</p>
          <a href="https://monapp.com/connexion">Se connecter</a>
        </body>
        </html>
      `);
    }

    return res.status(HttpStatus.BAD_REQUEST).type('text/html').send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Erreur de confirmation</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: linear-gradient(135deg, #d32f2f, #b71c1c);
              color: white;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
              animation: fadeIn 0.8s ease-in-out;
            }
            h1 {
              font-size: 2.5rem;
              margin-bottom: 10px;
            }
            p {
              font-size: 1.2rem;
              margin-bottom: 20px;
            }
            a {
              display: inline-block;
              padding: 12px 24px;
              background: white;
              color: #b71c1c;
              border-radius: 25px;
              font-weight: bold;
              text-decoration: none;
              transition: 0.3s;
            }
            a:hover {
              background: #f1f1f1;
              transform: scale(1.05);
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          </style>
        </head>
        <body>
          <h1>❌ Confirmation impossible</h1>
          <p>${result.message}</p>
          <a href="https://monapp.com/support">Contacter le support</a>
        </body>
        </html>
      `);
  }

  @Post('confirm-email')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Confirm email and activate account' })
  async confirmEmail(@Body() dto: ConfirmEmailDto) {
    return this.auth.confirmEmail(dto);
  }

  /** Demande de reset : envoie un email avec un token de réinitialisation */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Send password reset email' })
  async resetPasswordRequest(@Body() dto: ResetPasswordRequestDto) {
    return this.auth.resetPasswordRequest(dto);
  }

  /** Pose un nouveau mot de passe en fournissant le token reçu par email */
  @Post('recovery-password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Set a new password using the reset token' })
  async recoverPassword(@Body() dto: RecoverPasswordDto) {
    return this.auth.recoverPassword(dto);
  }
}
