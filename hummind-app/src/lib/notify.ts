"use client";

import { toast as sonnerToast } from "sonner";

const TOAST_DEDUPLICATION_WINDOW_MS = 2500;

type ToastMethod = (
  message: string,
  options?: Parameters<typeof sonnerToast.success>[1],
) => string | number;

const recentToastTimestamps = new Map<string, number>();

function normalizeToastMessage(message: string) {
  return message.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildToastKey(kind: string, message: string, customId?: string | number) {
  if (customId !== undefined && customId !== null) {
    return `id:${String(customId)}`;
  }

  const normalizedMessage = normalizeToastMessage(message);
  if (!normalizedMessage) {
    return null;
  }

  return `${kind}:${normalizedMessage}`;
}

function shouldSkipToast(key: string | null) {
  if (!key) return false;

  const now = Date.now();

  for (const [candidateKey, timestamp] of recentToastTimestamps.entries()) {
    if (now - timestamp > TOAST_DEDUPLICATION_WINDOW_MS) {
      recentToastTimestamps.delete(candidateKey);
    }
  }

  const previousTimestamp = recentToastTimestamps.get(key);
  if (
    previousTimestamp !== undefined &&
    now - previousTimestamp < TOAST_DEDUPLICATION_WINDOW_MS
  ) {
    return true;
  }

  recentToastTimestamps.set(key, now);
  return false;
}

function showToast(
  kind: "success" | "error" | "info" | "warning" | "message",
  method: ToastMethod,
  message: string,
  options?: Parameters<typeof sonnerToast.success>[1],
) {
  const key = buildToastKey(kind, message, options?.id);
  if (shouldSkipToast(key)) {
    return key ?? "";
  }

  return method(message, {
    ...options,
    id: options?.id ?? key ?? undefined,
  });
}

export const toast = {
  success(message: string, options?: Parameters<typeof sonnerToast.success>[1]) {
    return showToast("success", sonnerToast.success, message, options);
  },
  error(message: string, options?: Parameters<typeof sonnerToast.error>[1]) {
    return showToast("error", sonnerToast.error, message, options);
  },
  info(message: string, options?: Parameters<typeof sonnerToast.info>[1]) {
    return showToast("info", sonnerToast.info, message, options);
  },
  warning(message: string, options?: Parameters<typeof sonnerToast.warning>[1]) {
    return showToast("warning", sonnerToast.warning, message, options);
  },
  message(message: string, options?: Parameters<typeof sonnerToast.message>[1]) {
    return showToast("message", sonnerToast.message, message, options);
  },
  dismiss: sonnerToast.dismiss,
};

