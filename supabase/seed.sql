insert into public.business_templates (business_type, name, default_categories, default_columns)
values
  ('salon', 'Salon / Barber', '["Haircare","Styling","Shaving","Skincare","Tools","Cleaning"]', '["supplier","storage_location","expiry_date","low_stock_threshold"]'),
  ('cafe', 'Café', '["Coffee","Milk","Bakery","Syrups","Packaging","Cleaning"]', '["supplier","expiry_date","batch_number","low_stock_threshold"]'),
  ('grocery', 'Grocery / Kirana', '["Snacks","Beverages","Personal Care","Cleaning","Staples","Dairy"]', '["supplier","expiry_date","mrp","purchase_price","low_stock_threshold"]')
on conflict (business_type) do update set
  name = excluded.name,
  default_categories = excluded.default_categories,
  default_columns = excluded.default_columns;

do $$
declare
  demo_business_id uuid := '10000000-0000-0000-0000-000000000001';
  shampoo_id uuid := '20000000-0000-0000-0000-000000000001';
  wax_id uuid := '20000000-0000-0000-0000-000000000002';
begin
  insert into public.businesses (id, name, slug, business_type)
  values (demo_business_id, 'Urban Glow Salon', 'urban-glow', 'salon')
  on conflict (id) do nothing;

  insert into public.inventory_items (id, business_id, name, brand, category, description, quantity, unit, low_stock_threshold, price, source, ai_confidence)
  values
    (shampoo_id, demo_business_id, 'Dove Intense Repair Shampoo', 'Dove', 'Haircare', 'Nourishing shampoo for damaged hair.', 12, 'pcs', 3, 349, 'ai_scan', .94),
    (wax_id, demo_business_id, 'Matte Finish Hair Wax', null, 'Styling', 'Strong hold with a clean matte finish.', 2, 'pcs', 3, 299, 'manual', null)
  on conflict (id) do nothing;

  insert into public.product_listings (business_id, inventory_item_id, title, description, price, is_published)
  values
    (demo_business_id, shampoo_id, 'Dove Intense Repair Shampoo', 'Nourishing shampoo for damaged hair.', 349, true),
    (demo_business_id, wax_id, 'Matte Finish Hair Wax', 'Strong hold with a clean matte finish.', 299, true)
  on conflict (inventory_item_id) do nothing;

  insert into public.workflows (business_id, name, trigger_type, definition)
  values
    (demo_business_id, 'Create draft listing from scanned product', 'PRODUCT_SCANNED', '{"startNodeId":"description","nodes":[{"id":"description","type":"GENERATE_PRODUCT_DESCRIPTION","config":{}},{"id":"listing","type":"CREATE_DRAFT_LISTING","config":{}},{"id":"approval","type":"REQUEST_HUMAN_APPROVAL","config":{}}],"edges":[{"from":"description","to":"listing"},{"from":"listing","to":"approval"}]}'),
    (demo_business_id, 'Reduce stock when order is accepted', 'ORDER_ACCEPTED', '{"startNodeId":"reduce","nodes":[{"id":"reduce","type":"REDUCE_STOCK","config":{}},{"id":"check","type":"CHECK_LOW_STOCK","config":{}},{"id":"notify","type":"SEND_IN_APP_NOTIFICATION","config":{}}],"edges":[{"from":"reduce","to":"check"},{"from":"check","to":"notify"}]}'),
    (demo_business_id, 'Low stock reorder reminder', 'LOW_STOCK_DETECTED', '{"startNodeId":"task","nodes":[{"id":"task","type":"CREATE_SELLER_TASK","config":{}},{"id":"notify","type":"SEND_IN_APP_NOTIFICATION","config":{}}],"edges":[{"from":"task","to":"notify"}]}');
end $$;
