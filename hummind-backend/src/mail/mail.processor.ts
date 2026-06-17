import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import {
  MAIL_QUEUE_NAME,
  MailJobName,
  type AccountCreatedByAdminPayload,
  type AccountCreatedByRootPayload,
  type ContactRejectedPayload,
  type EmailConfirmationPayload,
  type EmailVerificationOtpPayload,
  type EntityInvitationPayload,
  type JoinRequestApprovedPayload,
  type MailJobPayload,
  type PasswordResetPayload,
  type PlainTextPayload,
  type WelcomePayload,
} from '../queue/queue.constants';

function frontUrl(path: string): string {
  const base = (process.env.FRONTEND_URL ?? '').replace(/\/+$/, '');
  return `${base}${path}`;
}

@Processor(MAIL_QUEUE_NAME, {
  // 5 concurrent SMTP connections is plenty for Gmail's per-account rate
  // (it caps around 100/minute on app passwords); raise via env if needed.
  concurrency: Number(process.env.MAIL_QUEUE_CONCURRENCY ?? 5),
})
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailer: MailerService) {
    super();
  }

  async process(job: Job<MailJobPayload>): Promise<void> {
    const name = job.name as MailJobName;

    try {
      switch (name) {
        case MailJobName.EMAIL_CONFIRMATION:
          return this.handleEmailConfirmation(
            job.data as EmailConfirmationPayload,
          );
        case MailJobName.PASSWORD_RESET:
          return this.handlePasswordReset(job.data as PasswordResetPayload);
        case MailJobName.ENTITY_INVITATION:
          return this.handleEntityInvitation(
            job.data as EntityInvitationPayload,
          );
        case MailJobName.WELCOME:
          return this.handleWelcome(job.data as WelcomePayload);
        case MailJobName.JOIN_REQUEST_APPROVED:
          return this.handleJoinRequestApproved(
            job.data as JoinRequestApprovedPayload,
          );
        case MailJobName.ACCOUNT_CREATED_BY_ROOT:
          return this.handleAccountCreatedByRoot(
            job.data as AccountCreatedByRootPayload,
          );
        case MailJobName.ACCOUNT_CREATED_BY_ADMIN:
          return this.handleAccountCreatedByAdmin(
            job.data as AccountCreatedByAdminPayload,
          );
        case MailJobName.CONTACT_REJECTED:
          return this.handleContactRejected(
            job.data as ContactRejectedPayload,
          );
        case MailJobName.EMAIL_VERIFICATION_OTP:
          return this.handleEmailVerificationOtp(
            job.data as EmailVerificationOtpPayload,
          );
        case MailJobName.PLAIN_TEXT:
          return this.handlePlainText(job.data as PlainTextPayload);
        default:
          this.logger.warn(`Unknown mail job name: ${name as string}`);
      }
    } catch (err) {
      // BullMQ will retry based on defaultJobOptions in QueueModule.
      this.logger.error(
        `Mail job ${name} failed (attempt ${job.attemptsMade + 1}): ${
          (err as Error).message
        }`,
      );
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Handlers (each one mirrors the old inline call in MailService)
  // ---------------------------------------------------------------------------

  private async handleEmailConfirmation(
    data: EmailConfirmationPayload,
  ): Promise<void> {
    const url = frontUrl(`/activate?token=${encodeURIComponent(data.token)}`);
    await this.mailer.sendMail({
      to: data.to,
      subject: 'Confirme ton adresse email',
      template: 'confirm-email',
      context: { url },
    });
  }

  private async handlePasswordReset(data: PasswordResetPayload): Promise<void> {
    const url = frontUrl(
      `/recover-password?token=${encodeURIComponent(data.token)}`,
    );
    await this.mailer.sendMail({
      to: data.to,
      subject: 'Réinitialise ton mot de passe',
      template: 'reset-password',
      context: { url },
    });
  }

  private async handleEntityInvitation(
    data: EntityInvitationPayload,
  ): Promise<void> {
    const url = frontUrl(
      `/invitations/accept?token=${encodeURIComponent(data.token)}`,
    );
    await this.mailer.sendMail({
      to: data.to,
      subject: `Invitation à rejoindre ${data.entityName}`,
      template: 'entity-invitation',
      context: { url, entityName: data.entityName },
    });
  }

  private async handleWelcome(data: WelcomePayload): Promise<void> {
    const url = frontUrl('/login');
    await this.mailer.sendMail({
      to: data.to,
      subject: `Bienvenue sur Hummind, ${data.firstname} ! 🎉`,
      template: 'welcome',
      context: { url, firstname: data.firstname },
    });
  }

  private async handleJoinRequestApproved(
    data: JoinRequestApprovedPayload,
  ): Promise<void> {
    const url = frontUrl('/login');
    await this.mailer.sendMail({
      to: data.to,
      subject: `Votre accès à ${data.entityName} a été validé !`,
      template: 'join-request-approved',
      context: { url, entityName: data.entityName },
    });
  }

  // --- New (Flow v2.0) -------------------------------------------------------

  private async handleAccountCreatedByRoot(
    data: AccountCreatedByRootPayload,
  ): Promise<void> {
    const url = frontUrl('/login');
    // Plain text for the v1 — a Handlebars template will replace it once the
    // design system has the email layout.
    const text = [
      `Bonjour ${data.firstname},`,
      ``,
      `Votre demande pour ${data.organizationName} a été acceptée par l'équipe Hummind.`,
      `Votre compte administrateur est prêt.`,
      ``,
      `Connexion : ${url}`,
      `Email : ${data.email}`,
      `Votre mot de passe temporaire : ${data.tempPassword}`,
      ``,
      `À la première connexion, vous serez invité(e) à choisir un mot de passe définitif.`,
      ``,
      `— L'équipe Hummind`,
    ].join('\n');

    await this.mailer.sendMail({
      to: data.to,
      subject: `Bienvenue chez Hummind — ${data.organizationName}`,
      text,
    });
  }

  private async handleAccountCreatedByAdmin(
    data: AccountCreatedByAdminPayload,
  ): Promise<void> {
    const url = frontUrl('/login');
    const text = [
      `Bonjour ${data.firstname},`,
      ``,
      `${data.inviterName} vous a ajouté(e) à ${data.entityName} sur Hummind.`,
      ``,
      `Connexion : ${url}`,
      `Email : ${data.email}`,
      `Votre mot de passe temporaire : ${data.tempPassword}`,
      ``,
      `À la première connexion, vous serez invité(e) à choisir un mot de passe définitif.`,
      ``,
      `— L'équipe Hummind`,
    ].join('\n');

    await this.mailer.sendMail({
      to: data.to,
      subject: `Vous avez été ajouté(e) à ${data.entityName}`,
      text,
    });
  }

  private async handleContactRejected(
    data: ContactRejectedPayload,
  ): Promise<void> {
    const org = data.organizationName ? ` pour ${data.organizationName}` : '';
    const text = [
      `Bonjour ${data.firstname},`,
      ``,
      `Merci pour votre demande de démonstration${org}.`,
      `Après étude, notre équipe ne peut pas y donner suite pour le moment.`,
      `Nous restons à votre écoute si votre contexte évolue.`,
      ``,
      `— L'équipe Hummind`,
    ].join('\n');

    await this.mailer.sendMail({
      to: data.to,
      subject: 'Votre demande Hummind',
      text,
    });
  }

  private async handleEmailVerificationOtp(
    data: EmailVerificationOtpPayload,
  ): Promise<void> {
    const text = [
      `Bonjour ${data.firstname},`,
      ``,
      `Voici votre code de vérification Hummind : ${data.code}`,
      ``,
      `Il est valable ${data.expiresInMinutes} minutes.`,
      `Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
      ``,
      `— L'équipe Hummind`,
    ].join('\n');

    await this.mailer.sendMail({
      to: data.to,
      subject: `Votre code Hummind : ${data.code}`,
      text,
    });
  }

  private async handlePlainText(data: PlainTextPayload): Promise<void> {
    await this.mailer.sendMail({
      to: data.to,
      subject: data.subject,
      text: data.text,
    });
  }
}
