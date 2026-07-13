-- LM3.9: Attach Ticombo URLs to remaining final-stage matches (no FIFA fields modified)
UPDATE public.matches
   SET ticombo_url = 'https://www.ticombo.com/en/sports-tickets/football-tickets/match-101-sf-w97-vs-w98-football-world-cup-2026-2607142359/049d9d94-d7ac-4200-a6d1-e61883750a98',
       updated_at = now()
 WHERE id = 'wc_wc2026-sf-01-att' AND ticombo_url IS NULL;

UPDATE public.matches
   SET ticombo_url = 'https://www.ticombo.com/en/sports-tickets/football-tickets/match-103-bronze-final-l101-vs-l102-football-world-cup-2026-2607182359/65970323-b2da-4efe-88dd-ff187033f4ac',
       updated_at = now()
 WHERE id = 'wc_wc2026-3p-hardrock' AND ticombo_url IS NULL;

UPDATE public.matches
   SET ticombo_url = 'https://www.ticombo.com/en/sports-tickets/football-tickets/match-104-final-w101-vs-w102-football-world-cup-2026-2607192359/6a99d429-3ad2-43b6-97ed-14acae5e8bcc',
       updated_at = now()
 WHERE id = 'wc_wc2026-final-metlife' AND (ticombo_url IS NULL OR ticombo_url LIKE '%/da/%');