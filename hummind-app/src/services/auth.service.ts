import type {
  ForgotFormValues,
  GetMeInfosResponse,
  SigninFormValues,
  SigninResponse,
} from "../dto/auth.dto";
import { clearAuthToken } from "../lib/server/authToken";
import { store } from "../store";
import { clear } from "../store/slices/userSlice";
import { safeFetch, type SafeResponse } from "./safeFetch";

const AUTH_API_URL = "/auth";

// Réponse polymorphique du backend /auth/signin :
// - flow normal : SigninResponse (token + user)
// - mdp temporaire : { requiresPasswordChange: true, tempToken } → redirection /first-login
// - email non vérifié : { resendEmail: true, message }
export type SigninResult =
  | (SigninResponse & { requiresPasswordChange?: false })
  | { requiresPasswordChange: true; tempToken: string; message?: string }
  | { success: false; resendEmail: true; message?: string };

export class AuthService {
  // Public self-signup is intentionally removed for Hummind v2 — accounts
  // are created by ROOT, by an org OWNER/ADMIN, or via /join/[code].

  static async signIn(
    values: SigninFormValues,
  ): Promise<SafeResponse<SigninResult>> {
    return safeFetch<SigninResult>(`${AUTH_API_URL}/signin`, {
      method: "POST",
      body: {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      },
    });
  }

  static async finalize(
    tempToken: string,
    newPassword: string,
  ): Promise<SafeResponse<SigninResponse>> {
    return safeFetch<SigninResponse>(`${AUTH_API_URL}/finalize`, {
      method: "POST",
      body: { tempToken, newPassword },
    });
  }

  static async signInWithGoogle(
    credential: string,
  ): Promise<SafeResponse<SigninResponse>> {
    return safeFetch<SigninResponse>(`${AUTH_API_URL}/google`, {
      method: "POST",
      body: { credential },
    });
  }

  static async activateAccount(token: string): Promise<SafeResponse<unknown>> {
    return safeFetch(`${AUTH_API_URL}/confirm-email`, {
      method: "POST",
      body: { token },
    });
  }

  static async forgotPassword(
    email: ForgotFormValues,
  ): Promise<SafeResponse<unknown>> {
    return safeFetch(`${AUTH_API_URL}/reset-password`, {
      method: "POST",
      body: { email },
    });
  }

  static async recoveryPassword(
    token: string,
    newPassword: string,
  ): Promise<SafeResponse<unknown>> {
    return safeFetch(`${AUTH_API_URL}/recovery-password`, {
      method: "POST",
      body: { token, newPassword },
    });
  }

  static async getUserInfo(
    token?: string,
  ): Promise<SafeResponse<GetMeInfosResponse>> {
    return safeFetch<GetMeInfosResponse>(`/users/me`, {
      method: "GET",
      token: token ?? null,
    });
  }

  static async signOut(): Promise<SafeResponse<null>> {
    clearAuthToken();
    store.dispatch(clear());

    return {
      status: 200,
      data: null,
      error: null,
    };
  }
}
