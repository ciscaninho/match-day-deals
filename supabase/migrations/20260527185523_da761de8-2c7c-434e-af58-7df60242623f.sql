
WITH parsed AS (
  SELECT m.id, m.group_code,
    (regexp_match(m.id, 'md[1-3]-([1-4])v([1-4])$'))[1]::int AS home_pos,
    (regexp_match(m.id, 'md[1-3]-([1-4])v([1-4])$'))[2]::int AS away_pos
  FROM public.matches m
  WHERE m.competition='FIFA World Cup 2026' AND m.id ~ 'md[1-3]-[1-4]v[1-4]$'
),
sl AS (
  SELECT group_code, slot_position, team_name,
    COALESCE(team_short, UPPER(LEFT(regexp_replace(team_name,'[^A-Za-z]','','g'),3))) AS short
  FROM public.wc_group_slots WHERE team_name IS NOT NULL
)
UPDATE public.matches m SET
  home_team = COALESCE(sh.team_name, m.group_code || p.home_pos),
  home_short = COALESCE(sh.short, m.group_code || p.home_pos),
  home_team_status = CASE WHEN sh.team_name IS NOT NULL THEN 'confirmed' ELSE 'projected' END,
  away_team = COALESCE(sa.team_name, m.group_code || p.away_pos),
  away_short = COALESCE(sa.short, m.group_code || p.away_pos),
  away_team_status = CASE WHEN sa.team_name IS NOT NULL THEN 'confirmed' ELSE 'projected' END
FROM parsed p
LEFT JOIN sl sh ON sh.group_code=p.group_code AND sh.slot_position=p.home_pos
LEFT JOIN sl sa ON sa.group_code=p.group_code AND sa.slot_position=p.away_pos
WHERE m.id = p.id;
