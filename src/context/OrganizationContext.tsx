'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type {
  Organization,
  OrgMember,
  OrgRole,
  CreateOrganizationData,
  UpdateOrganizationData,
} from '@/types/organization';

// =====================================================
// Context Type Definition
// =====================================================

interface OrganizationContextType {
  // Estado actual
  currentOrg: Organization | null;
  currentMembership: OrgMember | null;
  userOrganizations: Organization[];

  // Estado de carga
  loading: boolean;
  error: string | null;

  // Acciones
  switchOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  createOrganization: (data: CreateOrganizationData) => Promise<Organization>;
  updateOrganization: (updates: UpdateOrganizationData) => Promise<void>;
  deleteOrganization: () => Promise<void>;

  // Utilidades de permisos
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: OrgRole[]) => boolean;
  canAccessModule: (module: string) => boolean;
}

// =====================================================
// Context Creation
// =====================================================

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

// =====================================================
// Provider Component
// =====================================================

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [currentMembership, setCurrentMembership] = useState<OrgMember | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  // =====================================================
  // Load User Organizations
  // =====================================================

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserOrganizations([]);
        setCurrentOrg(null);
        setCurrentMembership(null);
        setLoading(false);
        return;
      }

      // Obtener todas las membresías del usuario
      const { data: memberships, error: membershipsError } = await supabase
        .from('org_members')
        .select(
          `
          *,
          organization:organizations(*)
        `
        )
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (membershipsError) throw membershipsError;

      // Extraer organizaciones
      const orgs =
        memberships
          ?.map((m: Record<string, unknown>) => m.organization as Organization)
          .filter(Boolean) || [];

      setUserOrganizations(orgs);

      // Obtener la organización actual del perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_org_id')
        .eq('id', user.id)
        .single();

      let targetOrgId = profile?.current_org_id;

      // Si no hay org actual, usar la primera disponible
      if (!targetOrgId && orgs.length > 0) {
        targetOrgId = orgs[0].id;

        // Actualizar el perfil
        await supabase
          .from('profiles')
          .update({ current_org_id: targetOrgId })
          .eq('id', user.id);
      }

      if (targetOrgId) {
        const org = orgs.find((o: Organization) => o.id === targetOrgId);
        const membership = memberships?.find((m: Record<string, unknown>) => m.org_id === targetOrgId);

        setCurrentOrg(org || null);
        setCurrentMembership(membership || null);
      }
    } catch (err: unknown) {
      console.error('Error loading organizations:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error loading organizations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // =====================================================
  // Switch Organization
  // =====================================================

  const switchOrganization = useCallback(
    async (orgId: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        // Actualizar current_org_id en el perfil
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ current_org_id: orgId })
          .eq('id', user.id);

        if (updateError) throw updateError;

        // Actualizar estado local
        const org = userOrganizations.find((o) => o.id === orgId);
        const { data: membership } = await supabase
          .from('org_members')
          .select('*')
          .eq('org_id', orgId)
          .eq('user_id', user.id)
          .single();

        setCurrentOrg(org || null);
        setCurrentMembership(membership);

        // Refrescar la página para recargar datos
        router.refresh();
      } catch (err: unknown) {
        console.error('Error switching organization:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error switching organization';
        setError(errorMessage);
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supabase, userOrganizations]
  );

  // =====================================================
  // Create Organization
  // =====================================================

  const createOrganization = useCallback(
    async (data: CreateOrganizationData): Promise<Organization> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        // Crear organización
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: data.name,
            slug: data.slug,
            owner_id: user.id,
            subscription_plan: data.subscription_plan || 'free',
            subscription_status: 'trial',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            timezone: data.timezone || 'America/Mexico_City',
            locale: data.locale || 'es',
          })
          .select()
          .single();

        if (orgError) throw orgError;

        // Crear membresía automática para el owner
        const { error: memberError } = await supabase.from('org_members').insert({
          org_id: newOrg.id,
          user_id: user.id,
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString(),
        });

        if (memberError) throw memberError;

        // Recargar organizaciones
        await loadOrganizations();

        // Forzar recarga de datos del lado del servidor (dashboards, etc.)
        router.refresh();

        return newOrg;
      } catch (err: unknown) {
        console.error('Error creating organization:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error creating organization';
        setError(errorMessage);
        throw err;
      }
    },
    [supabase, loadOrganizations]
  );

  // =====================================================
  // Update Organization
  // =====================================================

  const updateOrganization = useCallback(
    async (updates: UpdateOrganizationData) => {
      if (!currentOrg) throw new Error('No current organization');

      try {
        const { error } = await supabase
          .from('organizations')
          .update(updates)
          .eq('id', currentOrg.id);

        if (error) throw error;

        // Actualizar estado local
        setCurrentOrg({ ...currentOrg, ...updates });

        await loadOrganizations();
      } catch (err: unknown) {
        console.error('Error updating organization:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error updating organization';
        setError(errorMessage);
        throw err;
      }
    },
    [supabase, currentOrg, loadOrganizations]
  );

  // =====================================================
  // Delete Organization (soft delete)
  // =====================================================

  const deleteOrganization = useCallback(
    async () => {
      if (!currentOrg) throw new Error('No current organization');

      try {
        const { error } = await supabase
          .from('organizations')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', currentOrg.id);

        if (error) throw error;

        // Cambiar a otra organización si existe
        const otherOrg = userOrganizations.find((o) => o.id !== currentOrg.id);
        if (otherOrg) {
          await switchOrganization(otherOrg.id);
        } else {
          setCurrentOrg(null);
          setCurrentMembership(null);
        }

        await loadOrganizations();
      } catch (err: unknown) {
        console.error('Error deleting organization:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error deleting organization';
        setError(errorMessage);
        throw err;
      }
    },
    [supabase, currentOrg, userOrganizations, switchOrganization, loadOrganizations]
  );

  // =====================================================
  // Permission Helpers
  // =====================================================

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!currentMembership) return false;

      const rolePermissions: Record<OrgRole, string[]> = {
        owner: ['*'],
        admin: ['read', 'write', 'delete', 'manage_members', 'manage_settings'],
        technician: ['read', 'write'],
        viewer: ['read'],
      };

      const permissions = rolePermissions[currentMembership.role] || [];
      return permissions.includes('*') || permissions.includes(permission);
    },
    [currentMembership]
  );

  const hasRole = useCallback(
    (roles: OrgRole[]): boolean => {
      if (!currentMembership) return false;
      return roles.includes(currentMembership.role);
    },
    [currentMembership]
  );

  const canAccessModule = useCallback(
    (module: string): boolean => {
      if (!currentOrg) return false;
      return currentOrg.modules_enabled.includes(module as Module);
    },
    [currentOrg]
  );

  // =====================================================
  // Load on Mount
  // =====================================================

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // =====================================================
  // Context Value
  // =====================================================

  const value: OrganizationContextType = {
    currentOrg,
    currentMembership,
    userOrganizations,
    loading,
    error,
    switchOrganization,
    refreshOrganizations: loadOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    hasPermission,
    hasRole,
    canAccessModule,
  };

  // Si el usuario no tiene organizaciones, mostrar el onboarding
  const showOnboarding = !loading && userOrganizations.length === 0;

  return (
    <OrganizationContext.Provider value={value}>
      {showOnboarding ? (
        // Importamos dinámicamente para evitar circular dependencies
        <OnboardingWizardWrapper />
      ) : (
        children
      )}
    </OrganizationContext.Provider>
  );
}

// Wrapper para importar dinámicamente el OnboardingWizard
function OnboardingWizardWrapper() {
  const [OnboardingWizard, setOnboardingWizard] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import('@/components/organizations/OnboardingWizard').then((mod) => {
      setOnboardingWizard(() => mod.OnboardingWizard);
    });
  }, []);

  if (!OnboardingWizard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <OnboardingWizard />;
}

// =====================================================
// Hook to use Organization Context
// =====================================================

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
