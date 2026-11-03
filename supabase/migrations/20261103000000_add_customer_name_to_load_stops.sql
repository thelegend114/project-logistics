alter table public.load_stops
  add column if not exists customer_name text;
