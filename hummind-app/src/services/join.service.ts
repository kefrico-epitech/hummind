import { safeFetch, type SafeResponse } from "./safeFetch";

export interface JoinInfoResponse {
  code: string;
  salleName: string;
  organisationName: string | null;
  remainingUses: number | null;
  expiresAt: string | null;
}

export interface JoinSignupPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export interface JoinSignupResponse {
  userId: string;
  email: string;
  requiresEmailVerification: true;
  salleName: string;
}

export interface VerifyEmailResponse {
  success: true;
  user: { id: string; firstname: string; lastname: string; email: string };
  token: string;
  tokenType: string;
  expiresIn: string;
}

export interface JoinAcceptResponse {
  salleId: string;
  salleName: string;
  alreadyMember: boolean;
}

export class JoinService {
  static async getInfo(code: string): Promise<SafeResponse<JoinInfoResponse>> {
    return safeFetch<JoinInfoResponse>(`/public/join-info/${encodeURIComponent(code)}`, {
      method: "GET",
    });
  }

  static async signup(
    code: string,
    payload: JoinSignupPayload,
  ): Promise<SafeResponse<JoinSignupResponse>> {
    return safeFetch<JoinSignupResponse>(
      `/public/join/${encodeURIComponent(code)}/signup`,
      {
        method: "POST",
        body: payload as unknown as Record<string, unknown>,
      },
    );
  }

  static async verifyEmail(
    userId: string,
    code: string,
  ): Promise<SafeResponse<VerifyEmailResponse>> {
    return safeFetch<VerifyEmailResponse>("/public/verify-email", {
      method: "POST",
      body: { userId, code },
    });
  }

  static async acceptAsAuthenticated(
    code: string,
  ): Promise<SafeResponse<JoinAcceptResponse>> {
    return safeFetch<JoinAcceptResponse>(
      `/join/${encodeURIComponent(code)}/accept`,
      { method: "POST" },
    );
  }
}
