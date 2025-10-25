import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Notification,
  CreateNotificationData,
  NotificationFilters,
} from "@/types/notifications";
import { useUser } from "@/context/UserContext";
import { useOrganization } from "@/context/OrganizationContext";

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<{ success: boolean; error?: string }>;
  markAllAsRead: () => Promise<{ success: boolean; error?: string }>;
  deleteNotification: (id: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => void;
}

export function useNotifications(
  filters?: NotificationFilters
): UseNotificationsResult {
  const { profile } = useUser();
  const { currentOrg } = useOrganization();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    const orgId = currentOrg?.id;
    const userId = profile?.id;

    if (!orgId || !userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("org_id", orgId)
        .eq("user_id", userId);

      // Apply filters
      if (filters?.is_read !== undefined) {
        query = query.eq("is_read", filters.is_read);
      }

      if (filters?.type) {
        query = query.eq("type", filters.type);
      }

      // Order by most recent first
      query = query.order("created_at", { ascending: false });

      // Limit results
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error("[useNotifications] Error fetching:", fetchError);
        setError(fetchError.message);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      setNotifications(data || []);

      // Count unread
      const unread = (data || []).filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[useNotifications] Unexpected error:", err);
      setError(message);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    currentOrg?.id,
    profile?.id,
    filters?.is_read,
    filters?.type,
    filters?.limit,
  ]);

  useEffect(() => {
    fetchNotifications();

    // Set up realtime subscription for new notifications
    const orgId = currentOrg?.id;
    const userId = profile?.id;

    if (!orgId || !userId) {
      console.log('[useNotifications] No org or user, skipping realtime subscription');
      return;
    }

    console.log('[useNotifications] Setting up realtime subscription for user:', userId);

    const supabase = createClient();
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useNotifications] Realtime event received:', payload);
          // Refetch when there are changes
          fetchNotifications();
        }
      )
      .subscribe((status) => {
        console.log('[useNotifications] Subscription status:', status);
      });

    return () => {
      console.log('[useNotifications] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, currentOrg?.id, profile?.id]);

  const markAsRead = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    const userId = profile?.id;

    if (!currentOrg?.id || !userId) {
      return { success: false, error: "No organization or user found" };
    }

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)
        .eq("org_id", currentOrg.id);

      if (updateError) {
        console.error("[useNotifications] Mark as read error:", updateError);
        return { success: false, error: updateError.message };
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[useNotifications] Mark as read unexpected error:", err);
      return { success: false, error: message };
    }
  };

  const markAllAsRead = async (): Promise<{ success: boolean; error?: string }> => {
    const userId = profile?.id;

    if (!currentOrg?.id || !userId) {
      return { success: false, error: "No organization or user found" };
    }

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("is_read", false)
        .eq("org_id", currentOrg.id);

      if (updateError) {
        console.error("[useNotifications] Mark all as read error:", updateError);
        return { success: false, error: updateError.message };
      }

      // Refresh the list
      await fetchNotifications();

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[useNotifications] Mark all as read unexpected error:", err);
      return { success: false, error: message };
    }
  };

  const deleteNotification = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    const userId = profile?.id;

    if (!currentOrg?.id || !userId) {
      return { success: false, error: "No organization or user found" };
    }

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .eq("org_id", currentOrg.id);

      if (deleteError) {
        console.error("[useNotifications] Delete error:", deleteError);
        return { success: false, error: deleteError.message };
      }

      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => {
        const notification = notifications.find((n) => n.id === id);
        return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
      });

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[useNotifications] Delete unexpected error:", err);
      return { success: false, error: message };
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
