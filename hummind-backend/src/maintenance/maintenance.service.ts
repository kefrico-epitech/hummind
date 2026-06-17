import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Nettoyage quotidien à 3h du matin :
   * - OTP de vérification email expirés depuis plus de 24h
   * - Tokens password reset expirés
   * - Tokens email verification expirés
   * - Refresh tokens expirés
   * - Logs AI usage de plus de 90 jours (conservation raisonnable)
   *
   * Le soft-delete User/Entity reste en place : on ne purge PAS les rows
   * deletedAt — elles sont déjà anonymisées et leur conservation préserve
   * l'historique pédagogique (progressions, cours créés, etc.) pour les
   * autres apprenants.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async dailyCleanup(): Promise<void> {
    const now = Date.now();
    const oneDayAgo = new Date(now - ONE_DAY_MS);
    const ninetyDaysAgo = new Date(now - THIRTY_DAYS_MS * 3);

    try {
      const [otps, pwResets, verifTokens, refreshTokens, oldAiLogs] =
        await Promise.all([
          this.prisma.emailVerificationCode.deleteMany({
            where: { expiresAt: { lt: oneDayAgo } },
          }),
          this.prisma.passwordResetToken.deleteMany({
            where: { expiresAt: { lt: oneDayAgo } },
          }),
          this.prisma.verificationToken.deleteMany({
            where: { expiresAt: { lt: oneDayAgo } },
          }),
          this.prisma.refreshToken.deleteMany({
            where: { expiresAt: { lt: oneDayAgo } },
          }),
          this.prisma.aiUsageLog.deleteMany({
            where: { createdAt: { lt: ninetyDaysAgo } },
          }),
        ]);

      this.logger.log(
        `Daily cleanup OK — purged OTP=${otps.count}, pwReset=${pwResets.count}, ` +
          `verif=${verifTokens.count}, refresh=${refreshTokens.count}, ` +
          `aiUsageLog=${oldAiLogs.count}`,
      );
    } catch (err) {
      this.logger.error(
        `Daily cleanup failed: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  /**
   * Toutes les heures : purge des PublicJoinLink expirés depuis plus de 7j
   * (gardé une semaine pour donner le temps à un OWNER de comprendre pourquoi
   * son lien ne marche plus avant qu'il disparaisse).
   */
  @Cron(CronExpression.EVERY_HOUR)
  async hourlyJoinLinkCleanup(): Promise<void> {
    const sevenDaysAgo = new Date(Date.now() - 7 * ONE_DAY_MS);
    try {
      const result = await this.prisma.publicJoinLink.deleteMany({
        where: {
          enabled: false,
          expiresAt: { lt: sevenDaysAgo },
        },
      });
      if (result.count > 0) {
        this.logger.log(
          `Hourly cleanup OK — purged ${result.count} expired+disabled public join links`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Hourly join link cleanup failed: ${(err as Error).message}`,
      );
    }
  }
}
