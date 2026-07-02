-- Prioritize knockout Ticombo URLs in the discovery queue.
-- 1) Enqueue any knockout ticombo_url not yet in the queue, with an old discovered_at so it processes first.
INSERT INTO public.wc_ticombo_discovery_queue (url, status, attempts, discovered_at)
SELECT DISTINCT m.ticombo_url, 'pending', 0, now() - interval '365 days'
FROM public.matches m
WHERE m.competition = 'FIFA World Cup 2026'
  AND m.phase IN ('r32','r16','qf','sf','3p','final')
  AND m.archived_at IS NULL
  AND m.ticombo_url IS NOT NULL AND btrim(m.ticombo_url) <> ''
ON CONFLICT (url) DO NOTHING;

-- 2) Revive any knockout URLs sitting in failed/done (previous false-positive rejections) and reset priority.
UPDATE public.wc_ticombo_discovery_queue q
SET status = 'pending',
    attempts = 0,
    last_error = NULL,
    discovered_at = now() - interval '365 days'
FROM public.matches m
WHERE m.ticombo_url = q.url
  AND m.competition = 'FIFA World Cup 2026'
  AND m.phase IN ('r32','r16','qf','sf','3p','final')
  AND m.archived_at IS NULL
  AND q.status IN ('failed','done')
  AND NOT EXISTS (
    SELECT 1 FROM public.wc_ticket_coverage c
    WHERE c.match_id = m.id AND c.archived_at IS NULL AND c.status = 'active'
  );

-- 3) Bump priority for already-pending knockout URLs.
UPDATE public.wc_ticombo_discovery_queue q
SET discovered_at = now() - interval '365 days'
FROM public.matches m
WHERE m.ticombo_url = q.url
  AND m.competition = 'FIFA World Cup 2026'
  AND m.phase IN ('r32','r16','qf','sf','3p','final')
  AND q.status = 'pending';