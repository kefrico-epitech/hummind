// Nom de la queue BullMQ pour tous les emails transactionnels.
// Centralisé ici pour ne jamais le retaper en string littéral.
export const MAIL_QUEUE_NAME = 'mail';

// Job names supportés par la queue mail.
export const MailJobName = {
  EMAIL_CONFIRMATION: 'email-confirmation',
  PASSWORD_RESET: 'password-reset',
  ENTITY_INVITATION: 'entity-invitation',
  WELCOME: 'welcome',
  JOIN_REQUEST_APPROVED: 'join-request-approved',
  ACCOUNT_CREATED_BY_ROOT: 'account-created-by-root',
  ACCOUNT_CREATED_BY_ADMIN: 'account-created-by-admin',
  CONTACT_REJECTED: 'contact-rejected',
  EMAIL_VERIFICATION_OTP: 'email-verification-otp',
  PLAIN_TEXT: 'plain-text',
} as const;

export type MailJobName = (typeof MailJobName)[keyof typeof MailJobName];

// --- Payload types (un par job) ----------------------------------------------
export interface EmailConfirmationPayload {
  to: string;
  token: string;
}

export interface PasswordResetPayload {
  to: string;
  token: string;
}

export interface EntityInvitationPayload {
  to: string;
  token: string;
  entityName: string;
}

export interface WelcomePayload {
  to: string;
  firstname: string;
}

export interface JoinRequestApprovedPayload {
  to: string;
  entityName: string;
}

export interface AccountCreatedByRootPayload {
  to: string;
  firstname: string;
  email: string;
  tempPassword: string;
  organizationName: string;
}

export interface AccountCreatedByAdminPayload {
  to: string;
  firstname: string;
  email: string;
  tempPassword: string;
  entityName: string;
  inviterName: string;
}

export interface ContactRejectedPayload {
  to: string;
  firstname: string;
  organizationName: string | null;
}

export interface EmailVerificationOtpPayload {
  to: string;
  firstname: string;
  code: string; // code en clair, le hash est stocké côté BDD
  expiresInMinutes: number;
}

export interface PlainTextPayload {
  to: string;
  subject: string;
  text: string;
}

export type MailJobPayload =
  | EmailConfirmationPayload
  | PasswordResetPayload
  | EntityInvitationPayload
  | WelcomePayload
  | JoinRequestApprovedPayload
  | AccountCreatedByRootPayload
  | AccountCreatedByAdminPayload
  | ContactRejectedPayload
  | EmailVerificationOtpPayload
  | PlainTextPayload;
