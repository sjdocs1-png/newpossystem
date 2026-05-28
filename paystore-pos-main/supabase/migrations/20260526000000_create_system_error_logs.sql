-- Create system_error_logs table for edge function and DB failure tracking
create table if not exists public.system_error_logs (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  module text not null,
  action text not null,
  payload jsonb,
  error_message text not null,
  stack_trace text,
  created_at timestamptz default now() not null
);

alter table if exists public.system_error_logs
  enable row level security;
