# Multi-tenant Gap Analysis

## Remaining Org Filtering Risks
- `product_tags` does not expose an `org_id` column. Access control is enforced via RLS policies that traverse `products` ⇒ `org_members`. Client mutations (e.g., `useProducts`) now re-check tag ownership, but the table itself still relies entirely on policies for separation. Consider adding an `org_id` column + index to simplify filtering and reduce policy complexity. 【F:supabase/migrations/20251020040000_create_product_attributes_tables.sql†L228-L257】
- `budget_items` also lacks an `org_id` column. All filtering must join back to `budgets`, which is now enforced in `useBudgets` and the budget API route. Long term, adding an `org_id` column (with trigger-based maintenance) would allow direct filtering and easier auditing. 【F:supabase/migrations/20251019003000_create_budgets_system.sql†L34-L88】
- Supabase RPCs `validate_budget_stock`, `reserve_budget_inventory`, and `release_budget_inventory` do not accept an explicit `org_id`. They infer tenancy by reading the parent budget. Client code now performs ownership checks before calling them, but consider extending the functions’ signatures to require `p_org_id` to harden server-side validation. 【F:types/supabase.ts†L1337-L1374】【F:supabase/migrations/20251020030000_alter_budget_items_add_products.sql†L21-L118】

## Index & Performance Opportunities
- If an `org_id` column is added to `budget_items`, create a supporting b-tree index (`(org_id, budget_id)`) to keep lookups selective.
- Likewise, adding `org_id` to `product_tags` should be paired with indexes for `(org_id, product_id)` and `(org_id, tag_id)` to maintain performance once the column exists.

## Operational Notes
- The Supabase CLI command `supabase gen types typescript --project-id AXER --schema public` cannot run in this environment because fetching `supabase@latest` from npm returns `403 Forbidden`. The hand-maintained `types/supabase.ts` has been updated to cover the functions currently in use until CLI access is restored. 【34d8f4†L1-L6】【F:types/supabase.ts†L1337-L1374】
