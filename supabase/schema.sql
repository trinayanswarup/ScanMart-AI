create extension if not exists "pgcrypto";

create type business_kind as enum ('salon', 'cafe', 'grocery');
create type inventory_source as enum ('manual', 'ai_scan', 'receipt', 'import');
create type inventory_status as enum ('draft', 'active', 'archived');
create type order_status as enum ('new', 'accepted', 'completed', 'cancelled');
create type execution_status as enum ('running', 'success', 'failed', 'waiting_for_human');
create type node_execution_status as enum ('running', 'success', 'failed', 'skipped', 'waiting_for_human');

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  business_type business_kind not null,
  default_low_stock_threshold numeric not null default 3 check (default_low_stock_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_templates (
  id uuid primary key default gen_random_uuid(),
  business_type business_kind not null unique,
  name text not null,
  default_categories jsonb not null default '[]',
  default_columns jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  brand text,
  category text not null,
  subcategory text,
  description text,
  quantity numeric not null default 0 check (quantity >= 0),
  unit text not null default 'pcs',
  low_stock_threshold numeric not null default 3 check (low_stock_threshold >= 0),
  price numeric check (price is null or price > 0),
  image_url text,
  source inventory_source not null,
  ai_confidence numeric check (ai_confidence is null or ai_confidence between 0 and 1),
  metadata jsonb not null default '{}',
  status inventory_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_listings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  inventory_item_id uuid not null unique references public.inventory_items(id) on delete cascade,
  title text not null,
  description text not null,
  price numeric not null check (price > 0),
  image_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  status order_status not null default 'new',
  total_amount numeric not null default 0 check (total_amount >= 0),
  stock_reduced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (customer_phone is not null or customer_email is not null)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_listing_id uuid not null references public.product_listings(id),
  inventory_item_id uuid not null references public.inventory_items(id),
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  line_total numeric not null check (line_total >= 0)
);

create table public.scan_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  image_url text,
  input_text text,
  ai_raw_response jsonb not null default '{}',
  confirmed boolean not null default false,
  created_inventory_item_id uuid references public.inventory_items(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.ai_correction_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  scan_event_id uuid references public.scan_events(id) on delete set null,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  original_ai_output jsonb not null,
  corrected_output jsonb not null,
  created_at timestamptz not null default now()
);

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  trigger_type text not null,
  is_active boolean not null default true,
  definition jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  status execution_status not null default 'running',
  input_json jsonb not null default '{}',
  output_json jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.workflow_node_executions (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.workflow_executions(id) on delete cascade,
  node_id text not null,
  node_type text not null,
  status node_execution_status not null,
  input_json jsonb not null default '{}',
  output_json jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.seller_tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  status text not null default 'open' check (status in ('open', 'done')),
  context jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index inventory_business_idx on public.inventory_items(business_id);
create index inventory_low_stock_idx on public.inventory_items(business_id, quantity, low_stock_threshold);
create index listing_storefront_idx on public.product_listings(business_id, is_published);
create index orders_business_status_idx on public.orders(business_id, status);
create index workflow_trigger_idx on public.workflows(business_id, trigger_type) where is_active;
create index execution_workflow_idx on public.workflow_executions(workflow_id, started_at desc);
create index node_execution_parent_idx on public.workflow_node_executions(execution_id, started_at);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger businesses_updated before update on public.businesses for each row execute function public.set_updated_at();
create trigger inventory_updated before update on public.inventory_items for each row execute function public.set_updated_at();
create trigger listings_updated before update on public.product_listings for each row execute function public.set_updated_at();
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();
create trigger workflows_updated before update on public.workflows for each row execute function public.set_updated_at();

alter table public.businesses enable row level security;
alter table public.inventory_items enable row level security;
alter table public.product_listings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.scan_events enable row level security;
alter table public.ai_correction_logs enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_executions enable row level security;
alter table public.workflow_node_executions enable row level security;

create policy "owners manage businesses" on public.businesses for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners manage inventory" on public.inventory_items for all using (business_id in (select id from public.businesses where owner_id = auth.uid())) with check (business_id in (select id from public.businesses where owner_id = auth.uid()));
create policy "public reads published listings" on public.product_listings for select using (is_published);
create policy "owners manage listings" on public.product_listings for all using (business_id in (select id from public.businesses where owner_id = auth.uid())) with check (business_id in (select id from public.businesses where owner_id = auth.uid()));
create policy "public reads storefront businesses" on public.businesses for select using (true);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
