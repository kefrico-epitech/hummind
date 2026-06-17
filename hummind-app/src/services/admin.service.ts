import { safeFetch, type SafeResponse } from "./safeFetch";
import type {
  LearnerVolume,
  OrganizationType,
  ProjectHorizon,
} from "./contact.service";

export type ContactStatus =
  | "NEW"
  | "CONTACTED"
  | "ACCEPTED"
  | "REJECTED"
  | "ARCHIVED";
export type ContactKindServer = "DEMO" | "SUPPORT" | "GENERAL";

export interface AdminContact {
  id: string;
  kind: ContactKindServer;
  status: ContactStatus;
  name: string | null;
  email: string;
  phone: string | null;
  role: string | null;
  organizationName: string | null;
  organizationType: OrganizationType | null;
  learnerVolume: LearnerVolume | null;
  website: string | null;
  country: string | null;
  city: string | null;
  message: string;
  horizon: ProjectHorizon | null;
  source: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedContacts {
  data: AdminContact[];
  meta: { page: number; pageSize: number; total: number };
}

export interface ContactStats {
  NEW: number;
  CONTACTED: number;
  ACCEPTED: number;
  REJECTED: number;
  ARCHIVED: number;
}

export interface ListContactsParams {
  status?: ContactStatus;
  kind?: ContactKindServer;
  search?: string;
  page?: number;
  pageSize?: number;
}

function buildQuery(params: ListContactsParams): string {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.kind) sp.set("kind", params.kind);
  if (params.search?.trim()) sp.set("search", params.search.trim());
  sp.set("page", String(params.page ?? 1));
  sp.set("pageSize", String(params.pageSize ?? 20));
  return sp.toString();
}

export class AdminService {
  static async listContacts(
    params: ListContactsParams = {},
  ): Promise<SafeResponse<PaginatedContacts>> {
    return safeFetch<PaginatedContacts>(`/admin/contacts?${buildQuery(params)}`, {
      method: "GET",
    });
  }

  static async stats(): Promise<SafeResponse<ContactStats>> {
    return safeFetch<ContactStats>("/admin/contacts/stats", { method: "GET" });
  }

  static async getContact(id: string): Promise<SafeResponse<AdminContact>> {
    return safeFetch<AdminContact>(`/admin/contacts/${id}`, { method: "GET" });
  }

  static async updateStatus(
    id: string,
    status: ContactStatus,
  ): Promise<SafeResponse<AdminContact>> {
    return safeFetch<AdminContact>(`/admin/contacts/${id}`, {
      method: "PATCH",
      body: { status },
    });
  }

  /**
   * Workflow ROOT — 3 actions dédiées (Flow v2.0). Chacune fait l'audit
   * log côté serveur et envoie l'email approprié.
   */
  static async acceptContact(
    id: string,
  ): Promise<
    SafeResponse<{
      contact: AdminContact;
      user: { id: string; email: string };
      entity: { id: string; name: string };
    }>
  > {
    return safeFetch(`/admin/contacts/${id}/accept`, { method: "POST" });
  }

  static async markContacted(
    id: string,
  ): Promise<SafeResponse<AdminContact>> {
    return safeFetch<AdminContact>(`/admin/contacts/${id}/contact`, {
      method: "POST",
    });
  }

  static async rejectContact(
    id: string,
  ): Promise<SafeResponse<AdminContact>> {
    return safeFetch<AdminContact>(`/admin/contacts/${id}/reject`, {
      method: "POST",
    });
  }

  // ---------------------------------------------------------------------------
  // Users (Flow v2.0 Phase 8)
  // ---------------------------------------------------------------------------

  static async listUsers(
    params: ListUsersParams = {},
  ): Promise<SafeResponse<PaginatedUsers>> {
    const sp = new URLSearchParams();
    if (params.status) sp.set("status", params.status);
    if (params.platformRole) sp.set("platformRole", params.platformRole);
    if (params.search?.trim()) sp.set("search", params.search.trim());
    sp.set("page", String(params.page ?? 1));
    sp.set("pageSize", String(params.pageSize ?? 25));
    return safeFetch<PaginatedUsers>(`/admin/users?${sp.toString()}`, {
      method: "GET",
    });
  }

  static async updateUserStatus(
    id: string,
    status: AdminUserStatus,
    statusNote?: string,
  ): Promise<SafeResponse<AdminUserBrief>> {
    return safeFetch<AdminUserBrief>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: { status, statusNote },
    });
  }

  // ---------------------------------------------------------------------------
  // Audit log
  // ---------------------------------------------------------------------------

  static async listAuditLog(
    params: ListAuditLogParams = {},
  ): Promise<SafeResponse<PaginatedAuditLog>> {
    const sp = new URLSearchParams();
    if (params.action) sp.set("action", params.action);
    if (params.actorId) sp.set("actorId", params.actorId);
    if (params.targetType) sp.set("targetType", params.targetType);
    if (params.targetId) sp.set("targetId", params.targetId);
    sp.set("page", String(params.page ?? 1));
    sp.set("pageSize", String(params.pageSize ?? 50));
    return safeFetch<PaginatedAuditLog>(`/admin/audit-log?${sp.toString()}`, {
      method: "GET",
    });
  }
}

// ============================================================================
// Types: users & audit log (Phase 8)
// ============================================================================

export type AdminUserStatus = "INVITED" | "ACTIVE" | "DISABLED" | "BANNED";
export type AdminPlatformRole = "ROOT" | "MEMBER";

export interface AdminUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  platformRole: AdminPlatformRole;
  status: AdminUserStatus;
  mustChangePassword: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  bannedUntil: string | null;
  disabledAt: string | null;
}

export interface AdminUserBrief {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  platformRole: AdminPlatformRole;
  status: AdminUserStatus;
}

export interface PaginatedUsers {
  data: AdminUser[];
  meta: { page: number; pageSize: number; total: number };
}

export interface ListUsersParams {
  status?: AdminUserStatus;
  platformRole?: AdminPlatformRole;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  payload: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  } | null;
}

export interface PaginatedAuditLog {
  data: AuditLogEntry[];
  meta: { page: number; pageSize: number; total: number };
}

export interface ListAuditLogParams {
  action?: string;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  page?: number;
  pageSize?: number;
}
