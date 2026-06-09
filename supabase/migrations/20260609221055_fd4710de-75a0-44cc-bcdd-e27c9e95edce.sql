
-- 1. Extend newsletter_signups
ALTER TABLE public.newsletter_signups
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS confirmation_token uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_reason text,
  ADD COLUMN IF NOT EXISTS consent_given boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_ip text,
  ADD COLUMN IF NOT EXISTS brevo_contact_id bigint,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_signups_status_check'
  ) THEN
    ALTER TABLE public.newsletter_signups
      ADD CONSTRAINT newsletter_signups_status_check
      CHECK (status IN ('pending','confirmed','unsubscribed','bounced'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS newsletter_signups_status_idx ON public.newsletter_signups(status);
CREATE INDEX IF NOT EXISTS newsletter_signups_source_idx ON public.newsletter_signups(source);
CREATE INDEX IF NOT EXISTS newsletter_signups_created_at_idx ON public.newsletter_signups(created_at DESC);

-- Drop overly permissive anon-insert policies; edge function uses service role.
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'newsletter_signups'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.newsletter_signups', p.policyname);
  END LOOP;
END $$;

ALTER TABLE public.newsletter_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read newsletter signups"
  ON public.newsletter_signups FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No anon/authenticated INSERT/UPDATE/DELETE policies → service role only.
REVOKE INSERT, UPDATE, DELETE ON public.newsletter_signups FROM anon, authenticated;
GRANT SELECT ON public.newsletter_signups TO authenticated;
GRANT ALL ON public.newsletter_signups TO service_role;

-- 2. app_config key/value
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_config TO authenticated;
GRANT ALL ON public.app_config TO service_role;

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read app_config" ON public.app_config;
CREATE POLICY "Admins read app_config"
  ON public.app_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_app_config_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS app_config_updated_at ON public.app_config;
CREATE TRIGGER app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_app_config_updated_at();

-- 3. Backfill existing signups
UPDATE public.newsletter_signups
   SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, created_at)
 WHERE status = 'pending' AND created_at < now() - interval '1 day';
