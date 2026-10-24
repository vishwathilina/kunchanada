"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type NotificationItem = {
  id: string;
  type: string;
  caseId: string | null;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  href?: string;
};

type NotificationsResponse = { unread: number; items: NotificationItem[] };

export const POLL_INTERVAL_MS = 20_000;

export function useNotifications(limit = 10) {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications", limit],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?limit=${limit}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load notifications");
      return res.json();
    },
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export { notificationHref } from "@/lib/notification-href";
