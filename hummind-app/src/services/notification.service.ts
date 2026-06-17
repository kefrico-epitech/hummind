import { safeFetch, type SafeResponse } from "./safeFetch";

const NOTIFICATIONS_API_URL = "/notifications";

export const NOTIFICATIONS_UPDATED_EVENT = "notifications-updated";

export type NotificationPayload = Record<string, unknown> | null;

export interface NotificationItem {
  id: string;
  userId: string;
  entityId?: string | null;
  type: string;
  title: string;
  message?: string | null;
  data?: NotificationPayload;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationListMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  meta: NotificationListMeta;
}

export interface NotificationCounts {
  total: number;
  unread: number;
}

export interface NotificationQuery {
  unread?: boolean;
  entityId?: string;
  type?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

function buildNotificationQuery(query: NotificationQuery = {}) {
  const params = new URLSearchParams();

  if (typeof query.unread === "boolean") {
    params.set("unread", String(query.unread));
  }
  if (typeof query.entityId === "string" && query.entityId.trim().length > 0) {
    params.set("entityId", query.entityId);
  }
  if (typeof query.type === "string" && query.type.trim().length > 0) {
    params.set("type", query.type);
  }
  if (typeof query.sort === "string" && query.sort.trim().length > 0) {
    params.set("sort", query.sort);
  }
  if (typeof query.page === "number") {
    params.set("page", String(query.page));
  }
  if (typeof query.pageSize === "number") {
    params.set("pageSize", String(query.pageSize));
  }

  const suffix = params.toString();
  return suffix ? `?${suffix}` : "";
}

export function emitNotificationsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
  }
}

export class NotificationService {
  static async list(
    query: NotificationQuery = {},
  ): Promise<SafeResponse<NotificationListResponse>> {
    return safeFetch<NotificationListResponse>(
      `${NOTIFICATIONS_API_URL}${buildNotificationQuery(query)}`,
      { method: "GET" },
    );
  }

  static async counts(
    query: NotificationQuery = {},
  ): Promise<SafeResponse<NotificationCounts>> {
    return safeFetch<NotificationCounts>(
      `${NOTIFICATIONS_API_URL}/counts${buildNotificationQuery(query)}`,
      { method: "GET" },
    );
  }

  static async markRead(
    notificationId: string,
    readAt?: string | null,
  ): Promise<SafeResponse<NotificationItem>> {
    const body = readAt === undefined ? {} : { readAt };

    return safeFetch<NotificationItem>(
      `${NOTIFICATIONS_API_URL}/${notificationId}/read`,
      {
        method: "PATCH",
        body,
      },
    );
  }

  static async markAllRead(
    query: Pick<NotificationQuery, "entityId" | "type"> = {},
  ): Promise<SafeResponse<{ count: number }>> {
    return safeFetch<{ count: number }>(`${NOTIFICATIONS_API_URL}/read-all`, {
      method: "POST",
      body: query,
    });
  }

  static async delete(
    notificationId: string,
  ): Promise<SafeResponse<NotificationItem>> {
    return safeFetch<NotificationItem>(
      `${NOTIFICATIONS_API_URL}/${notificationId}`,
      {
        method: "DELETE",
      },
    );
  }
}
