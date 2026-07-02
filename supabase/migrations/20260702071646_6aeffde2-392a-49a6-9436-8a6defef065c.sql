UPDATE public.wc_ticombo_discovery_queue
   SET status='pending', last_error=NULL, processed_at=NULL, result='{}'::jsonb
 WHERE status='failed'
   AND last_error='non_single_fixture_page'
   AND url ~* '/football-tickets/match-[0-9]+';