// EntityService.ts
import type { AccessRequestItem } from "../dto/access-request.dto";
import { CreateEntityInput, Entity, EntityAncestor } from "../dto/entity.dto";
import { safeFetch, SafeResponse } from "./safeFetch";
import { Member, MemberRole } from "../dto/usersdto";

const BASE = "/entities";

type MemberPayload = {
  email: string;
  role: string;
};

type RequestAccessResponse =
  | {
      message?: string;
      entityId?: string;
      status?: "APPROVED";
    }
  | {
      message?: string;
      request?: {
        id: string;
        entityId: string;
        status: "PENDING";
        createdAt: string;
      };
    };

type InvitationLinkItem = {
  id: string;
  token?: string;
  link?: string;
  expiresAt?: string;
};

type MemberInvitationResult = {
  id?: string;
  invitationId?: string;
  email?: string;
  token?: string;
  link?: string;
  expiresAt?: string;
};

export type AddMemberOrInviteResult =
  | {
      kind: "member";
      status: number;
      member: Member;
    }
  | {
      kind: "invitation";
      status: number;
      invitation: MemberInvitationResult;
    }
  | {
      kind: "error";
      status: number;
      error: string;
    };

function shouldFallbackToInvitation(error: string | null | undefined) {
  const normalized = String(error || "").toLowerCase();
  return (
    normalized.includes("email not found") ||
    normalized.includes("email introuvable") ||
    normalized.includes("user not found") ||
    normalized.includes("not found")
  );
}

export class EntityService {
  static async list(): Promise<SafeResponse<Entity[]>> {
    return safeFetch<Entity[]>(`${BASE}/me`, { method: "GET" });
  }

  static async listStat(): Promise<SafeResponse<unknown>> {
    return safeFetch<unknown>(`/stats/dashboard`, { method: "GET" });
  }

  static async entityById(id: string): Promise<SafeResponse<Entity>> {
    return safeFetch<Entity>(`${BASE}/${id}`, { method: "GET" });
  }

  static async ancestors(entityId: string): Promise<SafeResponse<EntityAncestor[]>> {
    return safeFetch<EntityAncestor[]>(`${BASE}/${entityId}/ancestors`, {
      method: "GET",
    });
  }

  static async create(
    payload: CreateEntityInput
  ): Promise<SafeResponse<Entity>> {
    return safeFetch<Entity>(`${BASE}`, {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
    });
  }

  static async update(
    id: string,
    payload: Partial<CreateEntityInput>
  ): Promise<SafeResponse<Entity>> {
    return safeFetch<Entity>(`${BASE}/${id}`, {
      method: "PATCH",
      body: payload as unknown as Record<string, unknown>,
    });
  }

  /** 🔥 Suppression définitive */
  static async delete(id: string): Promise<SafeResponse<void>> {
    return safeFetch<void>(`${BASE}/${id}`, {
      method: "DELETE",
      headers: {}
    });
  }

  /** 📋 Récupérer les membres d’une entité */
  static async listMembers(
    entityId: string,
    status?: "ACTIVE" | "BANNED"
  ): Promise<SafeResponse<Member[]>> {
    const suffix = status
      ? `?${new URLSearchParams({ status }).toString()}`
      : "";

    return safeFetch<Member[]>(`${BASE}/${entityId}/members${suffix}`, {
      method: "GET",
    });
  }
  /**
   * Ajoute un membre à une entité (Flow v2.0 §6).
   * Le backend gère le dual-case : si l'email n'existe pas, il crée
   * automatiquement un User INVITED avec un mot de passe temporaire,
   * et renvoie `requiresInvitation: true` pour qu'on affiche le bon
   * message à l'UI.
   */
  static async addMember(
    entityId: string,
    payload: MemberPayload & { firstname?: string; lastname?: string },
  ): Promise<SafeResponse<Member & { requiresInvitation: boolean }>> {
    return safeFetch<Member & { requiresInvitation: boolean }>(
      `${BASE}/${entityId}/members`,
      {
        method: "POST",
        body: payload,
      },
    );
  }

  static async addMemberOrInvite(
    entityId: string,
    payload: MemberPayload,
  ): Promise<AddMemberOrInviteResult> {
    const normalizedPayload = {
      ...payload,
      email: payload.email.trim().toLowerCase(),
    };

    const addRes = await this.addMember(entityId, normalizedPayload);
    if (addRes.data) {
      return {
        kind: "member",
        status: addRes.status,
        member: addRes.data,
      };
    }

    if (!shouldFallbackToInvitation(addRes.error)) {
      return {
        kind: "error",
        status: addRes.status,
        error: addRes.error || "Erreur lors de l'ajout du membre",
      };
    }

    const inviteRes = await this.inviteMember(entityId, normalizedPayload);
    if ((inviteRes.status === 200 || inviteRes.status === 201) && inviteRes.data) {
      return {
        kind: "invitation",
        status: inviteRes.status,
        invitation: inviteRes.data,
      };
    }

    return {
      kind: "error",
      status: inviteRes.status,
      error: inviteRes.error || "Erreur lors de l'envoi de l'invitation",
    };
  }
  /** ✏️ Mettre à jour le rôle d’un membre */
  static async updateMemberRole(entityId: string, memberId: string, role: string): Promise<SafeResponse<Member>> {
    return safeFetch<Member>(`${BASE}/${entityId}/members/${memberId}/role`, { method: "PATCH", body: { role }, });
  }
  /** ✏️ Mettre à jour le rôle d’un membre */
  static async updateMember(entityId: string, memberId: string, payload: Record<string, unknown>): Promise<SafeResponse<Member>> {
    return safeFetch<Member>(`${BASE}/${entityId}/members/${memberId}/role`, { method: "PATCH", body: payload, });
  }
  /** 🗑️ Supprimer un membre */
  static async deleteMember(entityId: string, memberId: string): Promise<SafeResponse<void>> {
    return safeFetch<void>(`${BASE}/${entityId}/members/${memberId}`, { method: "DELETE", });
  }

  /** 🚫 Bannir un membre */
  static async banMember(
    entityId: string,
    memberId: string,
    payload?: { reason?: string }
  ): Promise<SafeResponse<Member>> {
    return safeFetch<Member>(`${BASE}/${entityId}/members/${memberId}/ban`, {
      method: "POST",
      body: payload ?? {},
    });
  }

  /** ✅ Débannir un membre */
  static async unbanMember(
    entityId: string,
    memberId: string
  ): Promise<SafeResponse<Member>> {
    return safeFetch<Member>(`${BASE}/${entityId}/members/${memberId}/unban`, {
      method: "POST",
      body: {},
    });
  }

  /** ➕ créate link share */
  static async createLink(entityId: string, role: MemberRole): Promise<SafeResponse<InvitationLinkItem>> {
    return safeFetch<InvitationLinkItem>(`${BASE}/${entityId}/members/invitations/public-link`, {
      method: "POST",
      body: { role },
    });
  }

  /** check link share */
  static async checkLink(entityId: string): Promise<SafeResponse<InvitationLinkItem[]>> {
    return safeFetch<InvitationLinkItem[]>(`${BASE}/${entityId}/members/invitations`, {
      method: "GET",
    });
  }

  /** check link share */
  static async getAllInvitation(): Promise<SafeResponse<AccessRequestItem[]>> {
    return safeFetch<AccessRequestItem[]>(`/entity-members/join-requests`, { method: "GET" });
  }

  /** invite member by email (send email invitation link) */
  static async inviteMember(
    entityId: string,
    payload: MemberPayload
  ): Promise<SafeResponse<MemberInvitationResult>> {
    return safeFetch<MemberInvitationResult>(
      `${BASE}/${entityId}/members/invitations`,
      {
        method: "POST",
        body: payload,
      }
    );
  }

  /** request link share */
  static async requestLink(token: string): Promise<SafeResponse<RequestAccessResponse>> {
    return safeFetch<RequestAccessResponse>(`/entity-members/request-access`, {
      method: "POST",
      body: { token },
    });
  }

  /** accept invitation by token (public route) */
  static async acceptInvitation(
    token: string
  ): Promise<SafeResponse<{ entityId?: string }>> {
    return safeFetch<{ entityId?: string }>(`/entity-members/accept`, {
      method: "POST",
      body: { token },
    });
  }

  /** accept link share */
  static async acceptLink(requestId: string): Promise<SafeResponse<void>> {
    return safeFetch<void>(`/entity-members/join-requests/${requestId}/approve`, { method: "POST" });
  }

  /** reject link share */
  static async rejectLink(requestId: string): Promise<SafeResponse<void>> {
    return safeFetch<void>(`/entity-members/join-requests/${requestId}/reject`, { method: "POST" });
  }
  /** group link share */
  static async groupLink(requestIds: string[], action: "APPROVE" | "REJECT"): Promise<SafeResponse<void>> {
    return safeFetch<void>(`/entity-members/join-requests/bulk`, { method: "POST", body: { requestIds, action } });
  }

  // Archiver / désarchiver une entité (soft delete)
  static async archive(id: string): Promise<SafeResponse<void>> {
    return safeFetch<void>(`${BASE}/${id}/archive`, { method: "PATCH" });
  }
  static async unarchive(id: string): Promise<SafeResponse<void>> {
    return safeFetch<void>(`${BASE}/${id}/unarchive`, { method: "PATCH" });
  }

  // Get catégories d’une entité
  static async listCategories(entityId: string): Promise<SafeResponse<{ id: string; nom: string }[]>> {
    return safeFetch<{ id: string; nom: string }[]>(`${BASE}/${entityId}/categories`, { method: "GET" });
  }
  static async createCategorie(entityId: string, name: string, groupIds: string[]): Promise<SafeResponse<void>> {
    return safeFetch<void>(`${BASE}/${entityId}/categories`, { method: "POST", body: JSON.stringify({ name, groupIds }) });
  }
  static async updateCategory(categoryId: string, name: string, groupIds: string[]): Promise<SafeResponse<void>> {
    return safeFetch<void>(`/categories/${categoryId}`, { method: "PATCH", body: JSON.stringify({ name, groupIds }) });
  }
  static async deleteCategory(categoryId: string): Promise<SafeResponse<void>> {
    return safeFetch<void>(`/categories/${categoryId}`, { method: "DELETE" });
  }

}
