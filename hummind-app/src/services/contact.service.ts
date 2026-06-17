import { safeFetch, type SafeResponse } from "./safeFetch";

export type ContactKind = "demo" | "support" | "general";

export type OrganizationType =
  | "SCHOOL_PRIMARY"
  | "SCHOOL_SECONDARY"
  | "UNIVERSITY"
  | "VOCATIONAL_CENTER"
  | "TRAINING_ORG"
  | "CORPORATE"
  | "INDEPENDENT"
  | "OTHER";

export type LearnerVolume =
  | "UNDER_50"
  | "BETWEEN_50_200"
  | "BETWEEN_200_1000"
  | "OVER_1000";

export type ProjectHorizon =
  | "IMMEDIATE"
  | "WITHIN_1_MONTH"
  | "WITHIN_3_MONTHS"
  | "EXPLORING";

export interface ContactPayload {
  kind: ContactKind;
  name?: string | null;
  email: string;
  phone?: string | null;
  role?: string | null;
  organizationName?: string | null;
  organizationType?: OrganizationType | null;
  learnerVolume?: LearnerVolume | null;
  website?: string | null;
  country?: string | null;
  city?: string | null;
  message: string;
  horizon?: ProjectHorizon | null;
  source?: string;
}

export class ContactService {
  static async send(
    payload: ContactPayload,
  ): Promise<SafeResponse<{ id: string }>> {
    return safeFetch<{ id: string }>("/contact", {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
      timeoutMs: 15_000,
    });
  }
}
