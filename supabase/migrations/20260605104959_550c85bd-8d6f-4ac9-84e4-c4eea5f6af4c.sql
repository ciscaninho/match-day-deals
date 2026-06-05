-- Restore Ticombo URLs erroneously cleared by wc-ticombo-url-suggest after Ticombo rate-limited discovery
UPDATE public.matches m
SET ticombo_url = b.ticombo_url, updated_at = now()
FROM public.matches_wc2026_backup_20260605 b
WHERE m.id = b.id
  AND m.competition = 'FIFA World Cup 2026'
  AND b.ticombo_url IS NOT NULL
  AND m.ticombo_url IS NULL;