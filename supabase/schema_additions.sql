-- schema_additions.sql
-- Run this AFTER supabase/schema.sql.
-- Adds the columns and table the FastAPI backend needs that are absent from
-- the original schema.

-- 1. Company table (AppState.company in the TypeScript frontend)
create table if not exists public.company (
  id   text primary key,
  name text not null
);

-- 2. workflow_executions: add the trigger column
--    (TypeScript WorkflowExecution.trigger — "PRODUCT_SCANNED", "ORDER_ACCEPTED", etc.)
alter table public.workflow_executions
  add column if not exists trigger text not null default '';

-- 3. workflow_node_executions: add human-readable node name
--    (TypeScript WorkflowNodeExecution.nodeName)
alter table public.workflow_node_executions
  add column if not exists node_name text not null default '';

-- 4. order_items: add snapshot name column
--    The TypeScript OrderItem.name is a creation-time snapshot of the product
--    name that must never be mutated even if the listing title changes later.
alter table public.order_items
  add column if not exists name text not null default '';

-- 5. product_listings: relax the price constraint to allow 0
--    Draft listings created by ai_scan have price = 0 until the seller sets one.
--    The approveWorkflowExecution guard (price <= 0) prevents publishing at £0.
alter table public.product_listings
  drop constraint if exists product_listings_price_check;
alter table public.product_listings
  add constraint product_listings_price_check check (price >= 0);
