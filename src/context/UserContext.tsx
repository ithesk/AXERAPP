"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { UserProfile, UpdateProfileData } from "@/types/profile";

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: UpdateProfileData) => Promise<{
    success: boolean;
    data?: UserProfile;
    error?: string;
  }>;
  uploadAvatar: (file: File) => Promise<{
    success: boolean;
    data?: UserProfile;
    error?: string;
  }>;
  deleteAvatar: () => Promise<{
    success: boolean;
    data?: UserProfile;
    error?: string;
  }>;
  refetchProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const userProfile = useUserProfile();

  return (
    <UserContext.Provider value={userProfile}>{children}</UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
