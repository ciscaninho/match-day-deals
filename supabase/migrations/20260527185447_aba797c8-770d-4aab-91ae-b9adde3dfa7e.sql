
-- WC group propagation fix: delete duplicate seed, normalize slot shorts, sweep placeholders
DELETE FROM public.matches WHERE id='wc2026-demo-A-md1';

UPDATE public.wc_group_slots SET team_short='MEX' WHERE group_code='A' AND slot_position=1 AND team_name IS NOT NULL;
UPDATE public.wc_group_slots SET team_short='RSA' WHERE group_code='A' AND slot_position=2 AND team_name IS NOT NULL;
UPDATE public.wc_group_slots SET team_short='KOR' WHERE group_code='A' AND slot_position=3 AND team_name IS NOT NULL;
UPDATE public.wc_group_slots SET team_short='CZE' WHERE group_code='A' AND slot_position=4 AND team_name IS NOT NULL;
UPDATE public.wc_group_slots SET team_short='CAN' WHERE group_code='B' AND slot_position=1 AND team_name IS NOT NULL;
UPDATE public.wc_group_slots SET team_short='BIH' WHERE group_code='B' AND slot_position=2 AND team_name IS NOT NULL;
UPDATE public.wc_group_slots SET team_short='SUI' WHERE group_code='B' AND slot_position=3 AND team_name IS NOT NULL;
UPDATE public.wc_group_slots SET team_short='QAT' WHERE group_code='B' AND slot_position=4 AND team_name IS NOT NULL;

-- Sweep matches: replace placeholder home_team with real team_name from slots
WITH slot_map AS (
  SELECT group_code || slot_position AS placeholder, team_name,
         COALESCE(team_short, UPPER(LEFT(regexp_replace(team_name,'[^A-Za-z]','','g'),3))) AS short
  FROM public.wc_group_slots WHERE team_name IS NOT NULL
)
UPDATE public.matches m SET
  home_team = sm.team_name, home_short = sm.short, home_team_status = 'confirmed'
FROM slot_map sm
WHERE m.competition='FIFA World Cup 2026' AND TRIM(m.home_team) = sm.placeholder;

WITH slot_map AS (
  SELECT group_code || slot_position AS placeholder, team_name,
         COALESCE(team_short, UPPER(LEFT(regexp_replace(team_name,'[^A-Za-z]','','g'),3))) AS short
  FROM public.wc_group_slots WHERE team_name IS NOT NULL
)
UPDATE public.matches m SET
  away_team = sm.team_name, away_short = sm.short, away_team_status = 'confirmed'
FROM slot_map sm
WHERE m.competition='FIFA World Cup 2026' AND TRIM(m.away_team) = sm.placeholder;

-- Re-normalize shorts on already-resolved rows to fix collisions
UPDATE public.matches m SET home_short = sub.short
FROM (SELECT group_code, team_name,
        COALESCE(team_short, UPPER(LEFT(regexp_replace(team_name,'[^A-Za-z]','','g'),3))) AS short
      FROM public.wc_group_slots WHERE team_name IS NOT NULL) sub
WHERE m.competition='FIFA World Cup 2026' AND m.group_code=sub.group_code AND m.home_team=sub.team_name;
UPDATE public.matches m SET away_short = sub.short
FROM (SELECT group_code, team_name,
        COALESCE(team_short, UPPER(LEFT(regexp_replace(team_name,'[^A-Za-z]','','g'),3))) AS short
      FROM public.wc_group_slots WHERE team_name IS NOT NULL) sub
WHERE m.competition='FIFA World Cup 2026' AND m.group_code=sub.group_code AND m.away_team=sub.team_name;
