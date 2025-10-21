// =====================================================
// Subscription & Plan Types
// =====================================================

import type { Tables } from "@/types/supabase";
import type { SubscriptionPlan, Module } from './organization';

type SubscriptionPlanRow = Tables<"subscription_plans">;

// =====================================================
// Subscription Plan Details
// =====================================================

export interface SubscriptionPlanDetails
  extends Omit<
    SubscriptionPlanRow,
    "modules" | "features" | "created_at" | "updated_at"
  > {
  modules: Module[];
  features: PlanFeature[];
  created_at?: SubscriptionPlanRow["created_at"];
}

// =====================================================
// Plan Feature
// =====================================================

export interface PlanFeature {
  name: string;
  included: boolean;
  description?: string;
}

// =====================================================
// Billing Cycle
// =====================================================

export type BillingCycle = 'monthly' | 'yearly';

// =====================================================
// Plan Comparison Data
// =====================================================

export interface PlanComparison {
  plan: SubscriptionPlan;
  name: string;
  price_monthly: number | null;
  price_yearly: number | null;
  features: {
    users: string;
    entradas: string;
    modules: string[];
    storage: string;
    support: string;
    custom_fields: boolean;
    api_access: boolean;
    advanced_reports: boolean;
    sso: boolean;
  };
  recommended?: boolean;
  popular?: boolean;
}

// =====================================================
// Predefined Plans (matching database)
// =====================================================

export const PLAN_FREE: PlanComparison = {
  plan: 'free',
  name: 'Gratis',
  price_monthly: 0,
  price_yearly: 0,
  features: {
    users: '1 usuario',
    entradas: '50 entradas/mes',
    modules: ['Entradas'],
    storage: '1 GB',
    support: 'Email',
    custom_fields: false,
    api_access: false,
    advanced_reports: false,
    sso: false,
  },
};

export const PLAN_STARTER: PlanComparison = {
  plan: 'starter',
  name: 'Starter',
  price_monthly: 29,
  price_yearly: 290,
  features: {
    users: 'Hasta 5 usuarios',
    entradas: '500 entradas/mes',
    modules: ['Entradas', 'Ventas'],
    storage: '10 GB',
    support: 'Email prioritario',
    custom_fields: false,
    api_access: false,
    advanced_reports: false,
    sso: false,
  },
  popular: true,
};

export const PLAN_PROFESSIONAL: PlanComparison = {
  plan: 'professional',
  name: 'Professional',
  price_monthly: 79,
  price_yearly: 790,
  features: {
    users: 'Hasta 20 usuarios',
    entradas: '2,000 entradas/mes',
    modules: ['Entradas', 'Ventas', 'Inventario', 'Compras'],
    storage: '50 GB',
    support: 'Email y Chat 24/5',
    custom_fields: true,
    api_access: true,
    advanced_reports: true,
    sso: false,
  },
  recommended: true,
};

export const PLAN_ENTERPRISE: PlanComparison = {
  plan: 'enterprise',
  name: 'Enterprise',
  price_monthly: null,
  price_yearly: null,
  features: {
    users: 'Ilimitados',
    entradas: 'Ilimitadas',
    modules: ['Todos los módulos'],
    storage: 'Ilimitado',
    support: '24/7 con SLA',
    custom_fields: true,
    api_access: true,
    advanced_reports: true,
    sso: true,
  },
};

export const ALL_PLANS: PlanComparison[] = [
  PLAN_FREE,
  PLAN_STARTER,
  PLAN_PROFESSIONAL,
  PLAN_ENTERPRISE,
];

// =====================================================
// Helper Functions
// =====================================================

export function getPlanDetails(plan: SubscriptionPlan): PlanComparison {
  return ALL_PLANS.find(p => p.plan === plan) || PLAN_FREE;
}

export function formatPrice(price: number | null, cycle: BillingCycle = 'monthly'): string {
  if (price === null) return 'Contactar';
  if (price === 0) return 'Gratis';

  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
  }).format(price);

  return cycle === 'yearly' ? `${formatted}/año` : `${formatted}/mes`;
}

export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  const monthlyCost = monthlyPrice * 12;
  return monthlyCost - yearlyPrice;
}

export function getYearlySavingsPercentage(monthlyPrice: number, yearlyPrice: number): number {
  const savings = calculateYearlySavings(monthlyPrice, yearlyPrice);
  const monthlyCost = monthlyPrice * 12;
  return Math.round((savings / monthlyCost) * 100);
}

export function canUpgradeTo(currentPlan: SubscriptionPlan, targetPlan: SubscriptionPlan): boolean {
  const planOrder: SubscriptionPlan[] = ['free', 'starter', 'professional', 'enterprise'];
  const currentIndex = planOrder.indexOf(currentPlan);
  const targetIndex = planOrder.indexOf(targetPlan);
  return targetIndex > currentIndex;
}

export function isUnlimited(value: number | null): boolean {
  return value === null;
}

export function formatLimit(value: number | null, unit: string): string {
  if (isUnlimited(value)) return 'Ilimitado';
  return `${value?.toLocaleString('es-MX')} ${unit}`;
}
