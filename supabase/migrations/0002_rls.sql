-- Sorszintű biztonság (RLS). A jogosultság alapja: a bejelentkezett auth user
-- melyik profilhoz tartozik. Segédfüggvény: auth_profile_id().

create or replace function auth_profile_id() returns text
language sql stable security definer set search_path = public as $$
  select id from profiles where auth_user_id = auth.uid()
$$;

alter table profiles       enable row level security;
alter table listings       enable row level security;
alter table conversations  enable row level security;
alter table messages       enable row level security;
alter table reviews        enable row level security;
alter table saved_searches enable row level security;
alter table favorites      enable row level security;

-- ---------- profiles: nyilvános névjegy, saját szerkeszthető ----------
create policy profiles_read_all on profiles for select using (true);
create policy profiles_update_own on profiles for update
  using (auth_user_id = auth.uid());
create policy profiles_insert_self on profiles for insert
  with check (auth_user_id = auth.uid());

-- ---------- listings: aktív hirdetés publikus, tulaj kezeli a sajátját ----------
create policy listings_read_active on listings for select
  using (status = 'active' or owner_id = auth_profile_id());
create policy listings_insert_own on listings for insert
  with check (owner_id = auth_profile_id());
create policy listings_update_own on listings for update
  using (owner_id = auth_profile_id());
create policy listings_delete_own on listings for delete
  using (owner_id = auth_profile_id());

-- ---------- conversations: csak a résztvevők ----------
create policy conv_read_parties on conversations for select
  using (buyer_id = auth_profile_id() or seller_id = auth_profile_id());
create policy conv_insert_buyer on conversations for insert
  with check (buyer_id = auth_profile_id());

-- ---------- messages: csak a beszélgetés résztvevői ----------
create policy msg_read_parties on messages for select using (
  exists (select 1 from conversations c where c.id = conversation_id
    and (c.buyer_id = auth_profile_id() or c.seller_id = auth_profile_id())));
create policy msg_insert_parties on messages for insert with check (
  sender_id = auth_profile_id() and exists (
    select 1 from conversations c where c.id = conversation_id
      and (c.buyer_id = auth_profile_id() or c.seller_id = auth_profile_id())));
create policy msg_update_read on messages for update using (
  exists (select 1 from conversations c where c.id = conversation_id
    and (c.buyer_id = auth_profile_id() or c.seller_id = auth_profile_id())));

-- ---------- reviews: publikusan olvasható, szerző írhat ----------
create policy reviews_read_all on reviews for select using (true);
create policy reviews_insert_author on reviews for insert
  with check (author_id = auth_profile_id());

-- ---------- saved_searches: csak a sajátja ----------
create policy ss_all_own on saved_searches for all
  using (user_id = auth_profile_id())
  with check (user_id = auth_profile_id());

-- ---------- favorites: csak a sajátja ----------
create policy fav_all_own on favorites for all
  using (user_id = auth_profile_id())
  with check (user_id = auth_profile_id());
