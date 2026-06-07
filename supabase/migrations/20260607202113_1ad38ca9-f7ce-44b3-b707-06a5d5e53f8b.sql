
-- ============ analytics_events ============
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  session_id TEXT,
  visitor_id TEXT,
  user_id UUID,
  page_url TEXT,
  page_path TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  campaign_id UUID,
  competition TEXT,
  match_id TEXT,
  home_team TEXT,
  away_team TEXT,
  stadium TEXT,
  host_city TEXT,
  host_country TEXT,
  browser TEXT,
  device TEXT,
  os TEXT,
  language TEXT,
  country TEXT,
  props JSONB NOT NULL DEFAULT '{}'::jsonb
);
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read analytics events" ON public.analytics_events
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events (event_type);
CREATE INDEX idx_analytics_events_session ON public.analytics_events (session_id);
CREATE INDEX idx_analytics_events_visitor ON public.analytics_events (visitor_id);
CREATE INDEX idx_analytics_events_utm_campaign ON public.analytics_events (utm_campaign);
CREATE INDEX idx_analytics_events_match ON public.analytics_events (match_id);

-- ============ marketing_campaigns ============
CREATE TABLE public.marketing_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  creator_name TEXT,
  competition TEXT,
  match_id TEXT,
  utm_source TEXT NOT NULL,
  utm_medium TEXT NOT NULL,
  utm_campaign TEXT NOT NULL,
  utm_content TEXT,
  target_path TEXT NOT NULL DEFAULT '/',
  short_id TEXT NOT NULL UNIQUE,
  notes TEXT,
  archived_at TIMESTAMPTZ
);
GRANT SELECT ON public.marketing_campaigns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can resolve short links" ON public.marketing_campaigns
  FOR SELECT TO anon, authenticated USING (archived_at IS NULL);
CREATE POLICY "Admins manage campaigns" ON public.marketing_campaigns
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_marketing_campaigns_short_id ON public.marketing_campaigns (short_id);
CREATE INDEX idx_marketing_campaigns_utm_campaign ON public.marketing_campaigns (utm_campaign);

-- ============ newsletter_signups ============
CREATE TABLE public.newsletter_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email TEXT NOT NULL,
  favourite_team TEXT,
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  campaign_id UUID,
  page_path TEXT,
  language TEXT,
  CONSTRAINT newsletter_signups_email_lower_unique UNIQUE (email)
);
GRANT INSERT ON public.newsletter_signups TO anon, authenticated;
GRANT SELECT ON public.newsletter_signups TO authenticated;
GRANT ALL ON public.newsletter_signups TO service_role;
ALTER TABLE public.newsletter_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can sign up to newsletter" ON public.newsletter_signups
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read newsletter signups" ON public.newsletter_signups
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_newsletter_signups_created_at ON public.newsletter_signups (created_at DESC);

-- ============ assistant_knowledge ============
CREATE TABLE public.assistant_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  priority INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT ON public.assistant_knowledge TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.assistant_knowledge TO authenticated;
GRANT ALL ON public.assistant_knowledge TO service_role;
ALTER TABLE public.assistant_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published knowledge" ON public.assistant_knowledge
  FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins manage knowledge" ON public.assistant_knowledge
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_assistant_knowledge_updated_at
  BEFORE UPDATE ON public.assistant_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_assistant_knowledge_topic ON public.assistant_knowledge (topic);
