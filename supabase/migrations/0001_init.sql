-- Jadran — Montenegrói ingatlan platform: kezdő séma
-- Text elsődleges kulcsok, hogy a meglévő seed id-k ("u-adriatic", "l-...")
-- változtatás nélkül átmigrálhatók legyenek. Az auth-hoz a profiles.auth_user_id
-- köti a valódi bejelentkezett usert egy profilhoz.

create extension if not exists postgis;

-- ---------- enumok ----------
do $$ begin
  create type property_type as enum (
    'apartment','house','villa','land','commercial','new',
    'office','hospitality','institution','garage','industrial','agricultural');
exception when duplicate_object then null; end $$;

do $$ begin
  create type condition as enum ('new','renovated','good','needs_work');
exception when duplicate_object then null; end $$;

do $$ begin
  create type view_type as enum ('sea','mountain','city');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_level as enum ('none','basic','deed','full');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_mode as enum ('sale','rent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_status as enum ('active','paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('buyer','seller','agency');
exception when duplicate_object then null; end $$;

do $$ begin
  create type amenity as enum (
    'wifi','ac','parking','pool','garden','elevator','balcony',
    'seaview','furnished','security','garage','storage','heating');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists profiles (
  id            text primary key,
  auth_user_id  uuid unique references auth.users(id) on delete set null,
  email         text not null,
  name          text not null,
  role          user_role not null default 'buyer',
  avatar        text,
  agency_name   text,
  bio           text not null default '',
  phone         text not null default '',
  location      text not null default '',
  verified      boolean not null default false,
  response_time text not null default '',
  joined_at     timestamptz not null default now()
);

-- ---------- listings ----------
create table if not exists listings (
  id                  text primary key,
  title               jsonb not null,          -- LocalizedText {hu,me,en,ru}
  description         jsonb not null,
  type                property_type not null,
  mode                listing_mode not null,
  status              listing_status not null default 'active',
  price               numeric not null,
  area                numeric not null,
  rooms               numeric not null default 0,
  floor               integer,
  year                integer,
  condition           condition not null default 'good',
  view                view_type not null default 'city',
  city                text not null,
  district            text not null default '',
  distance_to_sea     integer not null default 0,
  lat                 double precision not null,
  lng                 double precision not null,
  geom                geography(Point,4326) generated always as
                        (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored,
  verification        verification_level not null default 'none',
  images              text[] not null default '{}',
  amenities           amenity[] not null default '{}',
  owner_id            text not null references profiles(id) on delete cascade,
  agency              text not null default '',
  furnished           boolean not null default false,
  energy              text not null default '',
  created_at          timestamptz not null default now(),
  views               integer not null default 0,
  price_history       jsonb not null default '[]',
  -- rent-only
  deposit             numeric,
  min_term_months     integer,
  available_from      date,
  utilities_included  boolean,
  pets_allowed        boolean,
  -- sale-only
  plot_area           numeric,
  monthly_common_cost numeric,
  heating_type        text
);

create index if not exists listings_geom_idx    on listings using gist (geom);
create index if not exists listings_city_idx     on listings (city);
create index if not exists listings_mode_idx     on listings (mode);
create index if not exists listings_type_idx     on listings (type);
create index if not exists listings_price_idx    on listings (price);
create index if not exists listings_owner_idx    on listings (owner_id);
create index if not exists listings_status_idx   on listings (status);

-- ---------- conversations & messages ----------
create table if not exists conversations (
  id              text primary key,
  listing_id      text not null references listings(id) on delete cascade,
  buyer_id        text not null references profiles(id) on delete cascade,
  seller_id       text not null references profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index if not exists conversations_buyer_idx  on conversations (buyer_id);
create index if not exists conversations_seller_idx on conversations (seller_id);

create table if not exists messages (
  id              text primary key,
  conversation_id text not null references conversations(id) on delete cascade,
  sender_id       text not null references profiles(id) on delete cascade,
  text            text not null,
  created_at      timestamptz not null default now(),
  read_by         text[] not null default '{}'
);
create index if not exists messages_conv_idx on messages (conversation_id);

-- ---------- reviews ----------
create table if not exists reviews (
  id             text primary key,
  target_user_id text not null references profiles(id) on delete cascade,
  author_id      text not null references profiles(id) on delete cascade,
  author_name    text not null,
  rating         integer not null check (rating between 1 and 5),
  text           text not null default '',
  created_at     timestamptz not null default now()
);
create index if not exists reviews_target_idx on reviews (target_user_id);

-- ---------- saved searches & favorites ----------
create table if not exists saved_searches (
  id         text primary key,
  user_id    text not null references profiles(id) on delete cascade,
  label      text not null,
  query      text not null,
  created_at timestamptz not null default now(),
  notify     boolean not null default true    -- értesítés új találatra
);
create index if not exists saved_searches_user_idx on saved_searches (user_id);

create table if not exists favorites (
  user_id    text not null references profiles(id) on delete cascade,
  listing_id text not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
