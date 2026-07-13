UPDATE public.wc_ticombo_discovery_queue
   SET status = 'pending',
       last_error = NULL,
       attempts = 0,
       processed_at = NULL,
       discovered_at = '2000-01-01'::timestamptz
 WHERE url ILIKE '%match-101-sf-%'
    OR url ILIKE '%match-102-sf-%'
    OR url ILIKE '%match-103-bronze-final%'
    OR url ILIKE '%match-104-final-%';