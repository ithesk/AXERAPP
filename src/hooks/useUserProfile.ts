"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { UserProfile, UpdateProfileData } from "@/types/profile";

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No user logged in");
      }

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;

      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching profile");
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updates: UpdateProfileData) => {
    try {
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No user logged in");
      }

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setProfile(data);
      return { success: true, data };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error updating profile";
      setError(errorMessage);
      console.error("Error updating profile:", err);
      return { success: false, error: errorMessage };
    }
  };

  // Upload avatar
  const uploadAvatar = async (file: File) => {
    try {
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No user logged in");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Update profile with new avatar URL
      const result = await updateProfile({ avatar_url: publicUrl });

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error uploading avatar";
      setError(errorMessage);
      console.error("Error uploading avatar:", err);
      return { success: false, error: errorMessage };
    }
  };

  // Delete avatar
  const deleteAvatar = async () => {
    try {
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No user logged in");
      }

      if (profile?.avatar_url) {
        // Extract file path from URL
        const url = new URL(profile.avatar_url);
        const pathParts = url.pathname.split("/");
        const filePath = pathParts.slice(-2).join("/"); // user.id/filename

        // Delete from storage
        const { error: deleteError } = await supabase.storage
          .from("avatars")
          .remove([filePath]);

        if (deleteError) throw deleteError;
      }

      // Update profile to remove avatar URL
      const result = await updateProfile({ avatar_url: null });

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error deleting avatar";
      setError(errorMessage);
      console.error("Error deleting avatar:", err);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchProfile();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        fetchProfile();
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    refetchProfile: fetchProfile,
  };
}
