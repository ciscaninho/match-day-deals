-- LM3.9: Reprioritize final-stage Ticombo queue rows and reset M104 for retry
UPDATE public.wc_ticombo_discovery_queue
   SET status = 'pending',
       last_error = NULL,
       attempts = 0,
       processed_at = NULL,
       discovered_at = now() - interval '2 days'
 WHERE url ILIKE '%match-101-sf-%'
    OR url ILIKE '%match-102-sf-%'
    OR url ILIKE '%match-103-bronze-final%'
    OR url ILIKE '%match-104-final-%';

-- Also refresh existing SF2 coverage row so crawl picks it up again for price freshness
UPDATE public.wc_ticket_coverage
   SET last_sync_status = 'stale'
 WHERE match_id IN ('wc_wc2026-sf-02-mercedes');