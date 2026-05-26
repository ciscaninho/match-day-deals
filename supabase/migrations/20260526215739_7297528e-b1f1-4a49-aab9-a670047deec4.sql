
UPDATE public.wc_ticket_coverage
SET active = true,
    status = CASE WHEN status = 'archived' THEN 'active' ELSE status END,
    last_sync_status = NULL
WHERE provider ILIKE 'ticombo';

ALTER TABLE public.wc_ticket_coverage
ADD COLUMN IF NOT EXISTS url_type text;

UPDATE public.wc_ticket_coverage
SET url_type = CASE
  WHEN COALESCE(ticket_url, url) ~* '/search\?' THEN 'search'
  WHEN COALESCE(ticket_url, url) ~* '/sports-tickets/.+/[0-9a-f-]{30,}$' THEN 'event'
  WHEN COALESCE(ticket_url, url) ~* 'world-cup-2026/schedule' THEN 'discovery'
  WHEN COALESCE(ticket_url, url) ~* '/world-cup-2026/?$' THEN 'landing'
  ELSE COALESCE(url_type, 'event')
END;

-- Seed a single discovery row pointing at the Ticombo schedule hub (contains all 104 match URLs server-rendered)
INSERT INTO public.wc_ticket_coverage (
  stadium_slug, stadium_name, city, country, kind, provider,
  url, ticket_url, currency, status, priority, active, url_type
)
SELECT 'wc-2026-hub', 'FIFA World Cup 2026', NULL, NULL, 'resale', 'Ticombo',
       'https://www.ticombo.com/en/world-cup-2026/schedule',
       'https://www.ticombo.com/en/world-cup-2026/schedule',
       'EUR', 'active', 1, true, 'discovery'
WHERE NOT EXISTS (
  SELECT 1 FROM public.wc_ticket_coverage
  WHERE url_type = 'discovery' AND provider ILIKE 'ticombo'
);
