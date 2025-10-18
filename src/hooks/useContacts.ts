"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useOrganization } from "@/context/OrganizationContext";
import type {
  Contact,
  ContactModule,
  ContactAvailability,
  ContactAddress,
  CreateContactData,
  UpdateContactData,
} from "@/types/contacts";
import {
  CONTACT_MODULES,
  CONTACT_ALL_AVAILABILITY,
} from "@/types";

interface UseContactsOptions {
  module?: ContactModule;
  includeArchived?: boolean;
}

type ContactMutationResult =
  | { success: true; data: Contact }
  | { success: false; error: string };

type ContactDeleteResult = { success: true } | { success: false; error: string };

const normalizeModules = (modules: unknown): ContactAvailability[] => {
  if (!Array.isArray(modules) || modules.length === 0) {
    return [CONTACT_ALL_AVAILABILITY];
  }

  if (
    modules.some((module) => module === CONTACT_ALL_AVAILABILITY)
  ) {
    return [CONTACT_ALL_AVAILABILITY];
  }

  const filtered = modules.filter((module): module is ContactModule =>
    CONTACT_MODULES.includes(module as ContactModule)
  );

  return filtered.length > 0 ? filtered : [CONTACT_ALL_AVAILABILITY];
};

const normalizeAddress = (contact: any): ContactAddress => ({
  line1: contact.address_line1 ?? null,
  line2: contact.address_line2 ?? null,
  city: contact.address_city ?? null,
  state: contact.address_state ?? null,
  postal_code: contact.address_postal_code ?? null,
  country: contact.address_country ?? null,
});

const normalizeContact = (contact: any): Contact => ({
  id: contact.id,
  org_id: contact.org_id,
  name: contact.name,
  phone: contact.phone ?? null,
  mobile: contact.mobile ?? null,
  email: contact.email ?? null,
  is_client: contact.is_client ?? false,
  is_vendor: contact.is_vendor ?? false,
  tax_id: contact.tax_id ?? null,
  website: contact.website ?? null,
  avatar_url: contact.avatar_url ?? null,
  tags: Array.isArray(contact.tags) ? contact.tags : [],
  address: normalizeAddress(contact),
  available_in_modules: normalizeModules(contact.available_in_modules),
  notes: contact.notes ?? null,
  created_at: contact.created_at,
  updated_at: contact.updated_at,
  deleted_at: contact.deleted_at ?? null,
});

const mapAddressToColumns = (address?: ContactAddress) => ({
  address_line1: address?.line1 ?? null,
  address_line2: address?.line2 ?? null,
  address_city: address?.city ?? null,
  address_state: address?.state ?? null,
  address_postal_code: address?.postal_code ?? null,
  address_country: address?.country ?? null,
});

const normalizeTags = (tags?: string[] | null): string[] =>
  Array.isArray(tags)
    ? tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)
    : [];

const sortContacts = (items: Contact[]) =>
  [...items].sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  );

export function useContacts(options: UseContactsOptions = {}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();
  const { currentOrg } = useOrganization();

  const moduleFilter = options.module ?? null;
  const includeArchived = options.includeArchived ?? false;

  const fetchContacts = useCallback(async () => {
    if (!currentOrg) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("contacts")
        .select("*")
        .eq("org_id", currentOrg.id)
        .order("name", { ascending: true });

      if (!includeArchived) {
        query = query.is("deleted_at", null);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const normalized = (data ?? []).map(normalizeContact);
      const filtered = moduleFilter
        ? normalized.filter((contact) =>
            contact.available_in_modules.includes(CONTACT_ALL_AVAILABILITY) ||
            contact.available_in_modules.includes(moduleFilter)
          )
        : normalized;

      setContacts(sortContacts(filtered));
    } catch (err) {
      console.error("Error fetching contacts:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar los contactos"
      );
    } finally {
      setLoading(false);
    }
  }, [currentOrg, includeArchived, moduleFilter, supabase]);

  const createContact = useCallback(
    async (payload: CreateContactData): Promise<ContactMutationResult> => {
      if (!currentOrg) {
        const message = "No hay una organización seleccionada";
        setError(message);
        return { success: false, error: message };
      }

      try {
        setError(null);

        const modules = normalizeModules(
          payload.available_in_modules ?? [CONTACT_ALL_AVAILABILITY]
        );

        const insertPayload = {
          name: payload.name,
          phone: payload.phone ?? null,
          mobile: payload.mobile ?? null,
          email: payload.email ?? null,
          is_client: payload.is_client ?? true,
          is_vendor: payload.is_vendor ?? false,
          tax_id: payload.tax_id ?? null,
          website: payload.website ?? null,
          avatar_url: payload.avatar_url ?? null,
          tags: normalizeTags(payload.tags),
          notes: payload.notes ?? null,
          available_in_modules: modules,
          org_id: currentOrg.id,
          ...mapAddressToColumns(payload.address),
        };

        const { data, error: insertError } = await supabase
          .from("contacts")
          .insert([insertPayload])
          .select()
          .single();

        if (insertError) throw insertError;

        const normalized = normalizeContact(data);
        setContacts((prev) => sortContacts([...prev, normalized]));

        return { success: true, data: normalized };
      } catch (err) {
        console.error("Error creating contact:", err);
        const message =
          err instanceof Error ? err.message : "Error al crear el contacto";
        setError(message);
        return { success: false, error: message };
      }
    },
    [currentOrg, supabase]
  );

  const updateContact = useCallback(
    async (
      id: string,
      updates: UpdateContactData
    ): Promise<ContactMutationResult> => {
      if (!currentOrg) {
        const message = "No hay una organización seleccionada";
        setError(message);
        return { success: false, error: message };
      }

      try {
        setError(null);

        const updatePayload: Record<string, unknown> = {};

        if (updates.name !== undefined) updatePayload.name = updates.name;
        if (updates.phone !== undefined) updatePayload.phone = updates.phone;
        if (updates.mobile !== undefined) updatePayload.mobile = updates.mobile;
        if (updates.email !== undefined) updatePayload.email = updates.email;
        if (updates.is_client !== undefined) updatePayload.is_client = updates.is_client;
        if (updates.is_vendor !== undefined) updatePayload.is_vendor = updates.is_vendor;
        if (updates.tax_id !== undefined) updatePayload.tax_id = updates.tax_id;
        if (updates.website !== undefined) updatePayload.website = updates.website;
        if (updates.avatar_url !== undefined) updatePayload.avatar_url = updates.avatar_url;
        if (updates.tags !== undefined) updatePayload.tags = normalizeTags(updates.tags);
        if (updates.notes !== undefined) updatePayload.notes = updates.notes;

        if (updates.available_in_modules !== undefined) {
          updatePayload.available_in_modules = normalizeModules(
            updates.available_in_modules
          );
        }

        if (updates.address !== undefined) {
          Object.assign(updatePayload, mapAddressToColumns(updates.address));
        }

        const { data, error: updateError } = await supabase
          .from("contacts")
          .update(updatePayload)
          .eq("id", id)
          .eq("org_id", currentOrg.id)
          .select()
          .single();

        if (updateError) throw updateError;

        const normalized = normalizeContact(data);
        setContacts((prev) =>
          sortContacts(prev.map((contact) => (contact.id === id ? normalized : contact)))
        );

        return { success: true, data: normalized };
      } catch (err) {
        console.error("Error updating contact:", err);
        const message =
          err instanceof Error ? err.message : "Error al actualizar el contacto";
        setError(message);
        return { success: false, error: message };
      }
    },
    [currentOrg, supabase]
  );

  const deleteContact = useCallback(
    async (id: string): Promise<ContactDeleteResult> => {
      if (!currentOrg) {
        const message = "No hay una organización seleccionada";
        setError(message);
        return { success: false, error: message };
      }

      try {
        setError(null);

        const { error: deleteError } = await supabase
          .from("contacts")
          .delete()
          .eq("id", id)
          .eq("org_id", currentOrg.id);

        if (deleteError) throw deleteError;

        setContacts((prev) => prev.filter((contact) => contact.id !== id));
        return { success: true };
      } catch (err) {
        console.error("Error deleting contact:", err);
        const message =
          err instanceof Error ? err.message : "Error al eliminar el contacto";
        setError(message);
        return { success: false, error: message };
      }
    },
    [currentOrg, supabase]
  );

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const activeContacts = useMemo(
    () => contacts.filter((contact) => contact.deleted_at === null),
    [contacts]
  );

  return {
    contacts: includeArchived ? contacts : activeContacts,
    loading,
    error,
    createContact,
    updateContact,
    deleteContact,
    refetchContacts: fetchContacts,
  };
}
