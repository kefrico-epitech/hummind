import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
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

// MailService est désormais une façade qui pousse les emails dans la queue
// BullMQ. L'envoi SMTP réel se fait dans MailProcessor (worker dans le même
// process pour la v1, séparable plus tard si on veut un worker dédié).
@Injectable()
export class MailService {
  constructor(
    @InjectQueue(MAIL_QUEUE_NAME)
    private readonly mailQueue: Queue<MailJobPayload>,
  ) {}

  // ---------------------------------------------------------------------------
  // Stable methods (existing callers: auth.service, entity-members, ...)
  // ---------------------------------------------------------------------------

  async sendEmailConfirmation(to: string, token: string): Promise<void> {
    await this.enqueue<EmailConfirmationPayload>(
      MailJobName.EMAIL_CONFIRMATION,
      { to, token },
    );
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    await this.enqueue<PasswordResetPayload>(MailJobName.PASSWORD_RESET, {
      to,
      token,
    });
  }

  async sendEntityInvitation(
    to: string,
    token: string,
    entityName: string,
  ): Promise<void> {
    await this.enqueue<EntityInvitationPayload>(MailJobName.ENTITY_INVITATION, {
      to,
      token,
      entityName,
    });
  }

  async sendPlainText(to: string, subject: string, text: string): Promise<void> {
    await this.enqueue<PlainTextPayload>(MailJobName.PLAIN_TEXT, {
      to,
      subject,
      text,
    });
  }

  async sendJoinRequestApprovedEmail(
    to: string,
    entityName: string,
  ): Promise<void> {
    await this.enqueue<JoinRequestApprovedPayload>(
      MailJobName.JOIN_REQUEST_APPROVED,
      { to, entityName },
    );
  }

  async sendWelcomeEmail(to: string, firstname: string): Promise<void> {
    await this.enqueue<WelcomePayload>(MailJobName.WELCOME, { to, firstname });
  }

  // ---------------------------------------------------------------------------
  // New methods for Flow v2.0 — consumed by Phase 4 (ROOT pipeline) and
  // Phase 6 (apprenant via lien public + OTP).
  // ---------------------------------------------------------------------------

  async sendAccountCreatedByRoot(
    payload: AccountCreatedByRootPayload,
  ): Promise<void> {
    await this.enqueue<AccountCreatedByRootPayload>(
      MailJobName.ACCOUNT_CREATED_BY_ROOT,
      payload,
    );
  }

  async sendAccountCreatedByAdmin(
    payload: AccountCreatedByAdminPayload,
  ): Promise<void> {
    await this.enqueue<AccountCreatedByAdminPayload>(
      MailJobName.ACCOUNT_CREATED_BY_ADMIN,
      payload,
    );
  }

  async sendContactRejected(payload: ContactRejectedPayload): Promise<void> {
    await this.enqueue<ContactRejectedPayload>(
      MailJobName.CONTACT_REJECTED,
      payload,
    );
  }

  async sendEmailVerificationOtp(
    payload: EmailVerificationOtpPayload,
  ): Promise<void> {
    await this.enqueue<EmailVerificationOtpPayload>(
      MailJobName.EMAIL_VERIFICATION_OTP,
      payload,
    );
  }

  // ---------------------------------------------------------------------------
  // Internal helper — central place to add metadata, deduplication keys, etc.
  // ---------------------------------------------------------------------------

  private async enqueue<T extends MailJobPayload>(
    name: MailJobName,
    data: T,
  ): Promise<void> {
    await this.mailQueue.add(name, data as MailJobPayload);
  }
}
