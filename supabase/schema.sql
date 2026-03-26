-- ============================================================
-- Location Manager - Schéma Supabase
-- À exécuter dans SQL Editor de votre projet Supabase
-- ============================================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Profils utilisateurs (étend auth.users)
create table if not exists user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  owner_phone text,
  owner_address text,
  owner_postal_code text,
  owner_city text,
  created_at timestamptz default now()
);

-- Biens immobiliers
create table if not exists properties (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  address text,
  description text,
  capacity integer default 0,
  bedrooms integer default 0,
  base_price_per_night numeric(10,2) default 0,
  cleaning_fee numeric(10,2) default 0,
  tourist_tax_per_person numeric(10,2) default 0,
  deposit_amount numeric(10,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Options / services additionnels
create table if not exists options (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(10,2) default 0,
  price_type text check (price_type in ('fixed', 'per_night', 'per_person', 'per_person_per_night')) default 'fixed',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Modèles de contrats
create table if not exists contract_templates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  content text,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Réservations
create table if not exists bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  property_id uuid references properties(id) on delete set null,
  guest_first_name text,
  guest_last_name text,
  guest_email text,
  guest_phone text,
  guest_address text,
  num_guests integer default 1,
  check_in date,
  check_out date,
  source text check (source in ('airbnb', 'booking', 'leboncoin', 'site_loc_oleron', 'direct', 'other')) default 'direct',
  source_other text,
  status text default 'request',
  num_nights integer default 0,
  price_per_night numeric(10,2) default 0,
  subtotal_nights numeric(10,2) default 0,
  cleaning_fee numeric(10,2) default 0,
  tourist_tax_total numeric(10,2) default 0,
  options_total numeric(10,2) default 0,
  total_amount numeric(10,2) default 0,
  deposit_amount numeric(10,2) default 0,
  deposit_paid numeric(10,2) default 0,
  balance_paid numeric(10,2) default 0,
  concierge_fee numeric(10,2) default 0,
  host_service_fee numeric(10,2) default 0,
  quote_date date,
  contract_date date,
  quote_sent_by_email boolean default false,
  contract_sent_by_email boolean default false,
  payment_reminder_sent boolean default false,
  arrival_reminder_sent boolean default false,
  contract_signed boolean default false,
  contract_signed_date timestamptz,
  selected_options jsonb default '[]'::jsonb,
  notes text,
  created_at timestamptz default now()
);

-- Réservations personnelles du propriétaire
create table if not exists personal_bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  property_id uuid references properties(id) on delete set null,
  check_in date,
  check_out date,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table user_profiles enable row level security;
alter table properties enable row level security;
alter table options enable row level security;
alter table contract_templates enable row level security;
alter table bookings enable row level security;
alter table personal_bookings enable row level security;

-- Policies : chaque utilisateur gère uniquement ses propres données
create policy "user_profiles_policy" on user_profiles
  for all using (auth.uid() = id);

create policy "properties_policy" on properties
  for all using (auth.uid() = user_id);

create policy "options_policy" on options
  for all using (auth.uid() = user_id);

create policy "contract_templates_policy" on contract_templates
  for all using (auth.uid() = user_id);

create policy "bookings_policy" on bookings
  for all using (auth.uid() = user_id);

create policy "personal_bookings_policy" on personal_bookings
  for all using (auth.uid() = user_id);

-- ============================================================
-- TRIGGER : création du profil à l'inscription
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
