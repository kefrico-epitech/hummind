import type { SigninResponse } from "../dto/auth.dto";
import { setAuthToken } from "./server/authToken";
import { AuthService } from "../services/auth.service";
import type { AppDispatch } from "../store";
import { setUser } from "../store/slices/userSlice";

function normalizeRole(value: string | null | undefined) {
  return value === "ROOT" || value === "ADMIN" || value === "USER"
    ? value
    : null;
}

export async function establishAuthenticatedSession(
  response: SigninResponse | null | undefined,
  dispatch: AppDispatch,
) {
  if (!response?.token) {
    throw new Error("Jeton d'authentification manquant");
  }

  setAuthToken(response.token, 30);

  const meRes = await AuthService.getUserInfo(response.token);
  const currentUser = meRes.data?.user;

  if (meRes.status === 200 && currentUser) {
    dispatch(
      setUser({
        id: currentUser.id,
        email: currentUser.email,
        firstname: currentUser.firstname,
        lastname: currentUser.lastname,
        role: normalizeRole(currentUser.role),
      }),
    );
    return;
  }

  if (response.user) {
    dispatch(
      setUser({
        id: response.user.id,
        email: response.user.email,
        firstname: response.user.firstname,
        lastname: response.user.lastname,
        role: null,
      }),
    );
    return;
  }

  throw new Error("Impossible de charger le profil utilisateur");
}
