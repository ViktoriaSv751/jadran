-- Napi értesítő cron a mentett keresésekhez.
-- FUTTASD, miután beállítottad a RESEND_API_KEY és CRON_SECRET titkokat:
--   supabase secrets set RESEND_API_KEY=... CRON_SECRET=<véletlen-hosszú-string>
-- (a CRON_SECRET ugyanaz legyen itt is, lent az x-cron-secret fejlécben).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Minden nap 08:00 UTC-kor meghívja az edge functiont.
select cron.schedule(
  'notify-saved-searches-daily',
  '0 8 * * *',
  $$
  select net.http_post(
    url     := 'https://ebbuwlkozkyomkbgdoqq.supabase.co/functions/v1/notify-saved-searches',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'IDE_A_CRON_SECRET'   -- cseréld a beállított CRON_SECRET-re
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Leállítás:  select cron.unschedule('notify-saved-searches-daily');
