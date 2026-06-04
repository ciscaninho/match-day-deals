CREATE OR REPLACE FUNCTION public.wc_lock_official_fixture_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.competition = 'FIFA World Cup 2026'
     AND OLD.fixture_origin = 'official_import' THEN
    IF NEW.date IS DISTINCT FROM OLD.date
       OR NEW.stadium IS DISTINCT FROM OLD.stadium
       OR NEW.stadium_id IS DISTINCT FROM OLD.stadium_id
       OR NEW.city IS DISTINCT FROM OLD.city
       OR NEW.country IS DISTINCT FROM OLD.country
       OR NEW.phase IS DISTINCT FROM OLD.phase
       OR NEW.group_code IS DISTINCT FROM OLD.group_code
       OR NEW.matchday IS DISTINCT FROM OLD.matchday
       OR (NEW.fifa_match_number IS DISTINCT FROM OLD.fifa_match_number
           AND OLD.fifa_match_number IS NOT NULL) THEN
      RAISE EXCEPTION 'wc_official_fixture_locked: cannot modify date/stadium/city/phase/group/matchday on official WC fixture %', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;