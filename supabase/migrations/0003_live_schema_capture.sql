-- =============================================================================
-- 0003 — ÉLES SÉMA RÖGZÍTÉSE (séma-drift felszámolása)
--
-- A 0001/0002 után az éles DB-re számos változás került (részben a Supabase MCP-n
-- keresztül), amelyek eddig NEM voltak verziózva. Ez a fájl egy friss 0001+0002
-- adatbázist felhoz a jelenlegi éles állapotra, hogy új környezet / CI / disaster
-- recovery migrációból is helyes appot építsen.
--
-- Idempotens: minden lépés IF NOT EXISTS / OR REPLACE / DROP…IF EXISTS mintát követ,
-- így meglévő adatbázison is biztonságosan újrafuttatható.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Szerepkör-enum: a 'private' (magánszemély) hozzáadása
--    (a 0001 még csak buyer/seller/agency-t definiált)
-- -----------------------------------------------------------------------------
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'private';
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'private'::user_role;

-- -----------------------------------------------------------------------------
-- 2) Auth-híd: a profil összekötése a Supabase Auth felhasználóval
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.auth_profile_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $fn$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid()
$fn$;

-- -----------------------------------------------------------------------------
-- 3) Kiemelés (featured) + fizetések
-- -----------------------------------------------------------------------------
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS featured_until timestamptz;

CREATE TABLE IF NOT EXISTS public.payments (
  id                text PRIMARY KEY,
  user_id           text REFERENCES public.profiles(id),
  listing_id        text REFERENCES public.listings(id),
  kind              text NOT NULL,
  amount            integer NOT NULL,
  currency          text NOT NULL DEFAULT 'eur',
  stripe_session_id text UNIQUE,
  status            text NOT NULL DEFAULT 'pending',
  created_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_read_own ON public.payments;
CREATE POLICY payments_read_own ON public.payments FOR SELECT
  USING (user_id = auth_profile_id());

-- -----------------------------------------------------------------------------
-- 4) Mentett keresés — értesítési mezők
-- -----------------------------------------------------------------------------
ALTER TABLE public.saved_searches ADD COLUMN IF NOT EXISTS notify boolean NOT NULL DEFAULT true;
ALTER TABLE public.saved_searches ADD COLUMN IF NOT EXISTS last_notified_at timestamptz NOT NULL DEFAULT now();

-- -----------------------------------------------------------------------------
-- 5) Megtekintés-számláló (atomi RPC)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_views(p_listing_id text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $fn$
  UPDATE listings SET views = coalesce(views, 0) + 1 WHERE id = p_listing_id;
$fn$;

-- -----------------------------------------------------------------------------
-- 6) Hirdetés-bejelentések (moderáció)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listing_reports (
  id          text PRIMARY KEY,
  listing_id  text NOT NULL,
  reporter_id text,
  reason      text NOT NULL,
  note        text,
  status      text NOT NULL DEFAULT 'open',
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS report_insert_any ON public.listing_reports;
CREATE POLICY report_insert_any ON public.listing_reports FOR INSERT WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 7) Globális piac: ország-dimenzió a hirdetéseken
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE country_code AS ENUM ('ME','HR','AL','RS','TR','ID','HU','TH','IT','GR','ES');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Meglévő enumon a hiányzó értékek pótlása (ha a típus már létezett):
ALTER TYPE country_code ADD VALUE IF NOT EXISTS 'HU';
ALTER TYPE country_code ADD VALUE IF NOT EXISTS 'TH';
ALTER TYPE country_code ADD VALUE IF NOT EXISTS 'IT';
ALTER TYPE country_code ADD VALUE IF NOT EXISTS 'GR';
ALTER TYPE country_code ADD VALUE IF NOT EXISTS 'ES';

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS country country_code NOT NULL DEFAULT 'ME';
CREATE INDEX IF NOT EXISTS listings_country_idx ON public.listings (country);

-- -----------------------------------------------------------------------------
-- 8) Admin szerep + jelentés-moderálás jogosultságok
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS report_select_admin ON public.listing_reports;
CREATE POLICY report_select_admin ON public.listing_reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.auth_user_id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS report_update_admin ON public.listing_reports;
CREATE POLICY report_update_admin ON public.listing_reports FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.auth_user_id = auth.uid() AND p.is_admin))
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 9) BIZTONSÁG: a normál felhasználó ne eszkalálhasson jogot a saját profilján
--    (is_admin / verified), és ne írhassa át az identitását.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
BEGIN
  IF auth.role() = 'authenticated' THEN
    NEW.is_admin     := OLD.is_admin;
    NEW.verified     := OLD.verified;
    NEW.id           := OLD.id;
    NEW.auth_user_id := OLD.auth_user_id;
    NEW.email        := OLD.email;
  END IF;
  RETURN NEW;
END $fn$;
DROP TRIGGER IF EXISTS trg_protect_profile ON public.profiles;
CREATE TRIGGER trg_protect_profile BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- -----------------------------------------------------------------------------
-- 10) BIZTONSÁG: üzenet-oszlopok védelme — a résztvevő CSAK a read_by-t írhatja
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_message_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
BEGIN
  IF auth.role() = 'authenticated' THEN
    NEW.text            := OLD.text;
    NEW.sender_id       := OLD.sender_id;
    NEW.created_at      := OLD.created_at;
    NEW.conversation_id := OLD.conversation_id;
    NEW.id              := OLD.id;
  END IF;
  RETURN NEW;
END $fn$;
DROP TRIGGER IF EXISTS trg_protect_message ON public.messages;
CREATE TRIGGER trg_protect_message BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.protect_message_columns();

-- -----------------------------------------------------------------------------
-- 11) Hirdetés-limit: a TELJES darabszám számít (a szüneteltet→új feladás
--     megkerülés megszűnik). Iroda: bőséges keret (ingyenes próbaidő);
--     magánszemély: 3.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_listing_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE cnt int; lim int; urole text;
BEGIN
  IF TG_OP <> 'INSERT' THEN RETURN NEW; END IF;
  SELECT role::text INTO urole FROM profiles WHERE id = NEW.owner_id;
  lim := CASE WHEN urole = 'agency' THEN 1000 ELSE 3 END;
  SELECT count(*) INTO cnt FROM listings WHERE owner_id = NEW.owner_id;
  IF cnt >= lim THEN
    RAISE EXCEPTION 'listing_limit_exceeded' USING errcode = 'P0001';
  END IF;
  RETURN NEW;
END $fn$;
DROP TRIGGER IF EXISTS trg_enforce_listing_limit ON public.listings;
CREATE TRIGGER trg_enforce_listing_limit BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_listing_limit();

-- -----------------------------------------------------------------------------
-- 12) Beszélgetések: hiányzó UPDATE szabály (a last_message_at eddig némán bukott)
--     + duplikátum-védelem (egy hirdetés/vevő/eladó hármasra egy szál)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS conv_update_parties ON public.conversations;
CREATE POLICY conv_update_parties ON public.conversations FOR UPDATE TO authenticated
  USING (buyer_id = auth_profile_id() OR seller_id = auth_profile_id())
  WITH CHECK (buyer_id = auth_profile_id() OR seller_id = auth_profile_id());

CREATE UNIQUE INDEX IF NOT EXISTS conversations_triple_uidx
  ON public.conversations (listing_id, buyer_id, seller_id);

-- -----------------------------------------------------------------------------
-- 13) Értékelések: nem értékelheted magad, és egy célpontot csak egyszer
-- -----------------------------------------------------------------------------
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_not_self;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_not_self CHECK (author_id <> target_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS reviews_author_target_uidx
  ON public.reviews (author_id, target_user_id);

-- -----------------------------------------------------------------------------
-- 14) Olvasottság-jelölés RPC — egyetlen írás, verseny-mentes read_by bővítés
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_messages_read(p_conversation_id text, p_reader_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = p_conversation_id
      AND (c.buyer_id = auth_profile_id() OR c.seller_id = auth_profile_id())
      AND auth_profile_id() = p_reader_id
  ) THEN
    RETURN;
  END IF;
  UPDATE messages
    SET read_by = (SELECT array_agg(DISTINCT e) FROM unnest(read_by || ARRAY[p_reader_id]) e)
    WHERE conversation_id = p_conversation_id
      AND NOT (read_by @> ARRAY[p_reader_id]);
END $fn$;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(text, text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 15) Realtime: az üzenet/beszélgetés delta-események engedélyezése
--     (a kliens így nem pollozza folyamatosan a teljes történetet)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- 16) Teljesítmény-indexek a tényleges lekérdezési mintákhoz
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS listings_status_created_idx ON public.listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_owner_idx          ON public.listings (owner_id);
CREATE INDEX IF NOT EXISTS listings_city_idx           ON public.listings (city);
CREATE INDEX IF NOT EXISTS listings_mode_idx           ON public.listings (mode);
CREATE INDEX IF NOT EXISTS listings_price_idx          ON public.listings (price);
CREATE INDEX IF NOT EXISTS messages_conv_created_idx   ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS conversations_buyer_idx     ON public.conversations (buyer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS conversations_seller_idx    ON public.conversations (seller_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS reviews_target_idx          ON public.reviews (target_user_id);
CREATE INDEX IF NOT EXISTS favorites_user_idx          ON public.favorites (user_id);
