import type { SigninResponse } from "../dto/auth.dto";
import { safeFetch, type SafeResponse } from "./safeFetch";

const USER_API_URL = "/users";

export type DashboardKpis = {
  organisations: number;
  departments: number;
  rooms: number;
  courses: number;
  participants: number;
  responsibles: number;
};

export type DashboardOrganisationStat = {
  id: string;
  name: string;
  departments: number;
  rooms: number;
  participants: number;
  courses: number;
};

export type DashboardStatsResponse = {
  kpis: DashboardKpis;
  organisationStats: DashboardOrganisationStat[];
};

export type ArchivedEntity = {
  id: string;
  name: string;
  description?: string;
  type?:
    | "ORGANISATION"
    | "DEPARTEMENT"
    | "SALLE_ASSOCIEE"
    | "SALLE_INDEPENDANTE";
  picture?: string | null;
};

export class UserService {
  static async getCurrentUser(): Promise<SafeResponse<SigninResponse>> {
    return safeFetch<SigninResponse>(`${USER_API_URL}/me`, {
      method: "GET",
    });
  }

  static async getUsersStats(): Promise<SafeResponse<DashboardStatsResponse>> {
    return safeFetch<DashboardStatsResponse>(`/stats/dashboard`, {
      method: "GET",
    });
  }

  static async getUsersArchives(): Promise<SafeResponse<ArchivedEntity[]>> {
    return safeFetch<ArchivedEntity[]>(`/entities/archives`, {
      method: "GET",
    });
  }

  static async updateUsersInfos(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<SafeResponse<unknown>> {
    return safeFetch(`${USER_API_URL}/${id}`, {
      method: "PATCH",
      body: payload,
    });
  }
}
