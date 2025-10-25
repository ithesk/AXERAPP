import type { Tables, TablesUpdate } from "@/types/supabase";

type ProfileRow = Tables<"profiles">;

export interface UserProfile extends ProfileRow {
  org_id?: string | null;
}

export type UpdateProfileData = Omit<
  TablesUpdate<"profiles">,
  "id"
>;
