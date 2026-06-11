-- ============================================
-- Sprint League Management 1
-- Confederations, Countries, Leagues foundation
-- ============================================

-- 1) CONFEDERATIONS -----------------------------------------------------------
CREATE TABLE public.confederations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.confederations TO anon, authenticated;
GRANT ALL ON public.confederations TO service_role;
ALTER TABLE public.confederations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read confederations" ON public.confederations
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage confederations" ON public.confederations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.confederations(name, slug) VALUES
  ('UEFA','uefa'),
  ('CONMEBOL','conmebol'),
  ('CONCACAF','concacaf'),
  ('CAF','caf'),
  ('AFC','afc'),
  ('OFC','ofc');

-- 2) COUNTRIES ----------------------------------------------------------------
CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  iso2 text,
  iso3 text,
  flag_url text,
  confederation_id uuid REFERENCES public.confederations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX countries_iso3_uq ON public.countries(iso3)
  WHERE iso3 IS NOT NULL AND iso3 <> '';
CREATE INDEX countries_confederation_idx ON public.countries(confederation_id);
GRANT SELECT ON public.countries TO anon, authenticated;
GRANT ALL ON public.countries TO service_role;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read countries" ON public.countries
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage countries" ON public.countries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- UEFA (incl. UK home nations as standalone)
INSERT INTO public.countries(name, slug, iso2, iso3, confederation_id)
SELECT v.name, v.slug, v.iso2, v.iso3, c.id
FROM (VALUES
  ('England','england',NULL,'ENG'),
  ('Scotland','scotland',NULL,'SCO'),
  ('Wales','wales',NULL,'WAL'),
  ('Northern Ireland','northern-ireland',NULL,'NIR'),
  ('Republic of Ireland','republic-of-ireland','IE','IRL'),
  ('France','france','FR','FRA'),
  ('Spain','spain','ES','ESP'),
  ('Germany','germany','DE','DEU'),
  ('Italy','italy','IT','ITA'),
  ('Portugal','portugal','PT','PRT'),
  ('Netherlands','netherlands','NL','NLD'),
  ('Belgium','belgium','BE','BEL'),
  ('Switzerland','switzerland','CH','CHE'),
  ('Austria','austria','AT','AUT'),
  ('Denmark','denmark','DK','DNK'),
  ('Sweden','sweden','SE','SWE'),
  ('Norway','norway','NO','NOR'),
  ('Finland','finland','FI','FIN'),
  ('Iceland','iceland','IS','ISL'),
  ('Poland','poland','PL','POL'),
  ('Czech Republic','czech-republic','CZ','CZE'),
  ('Slovakia','slovakia','SK','SVK'),
  ('Hungary','hungary','HU','HUN'),
  ('Romania','romania','RO','ROU'),
  ('Bulgaria','bulgaria','BG','BGR'),
  ('Greece','greece','GR','GRC'),
  ('Turkey','turkey','TR','TUR'),
  ('Russia','russia','RU','RUS'),
  ('Ukraine','ukraine','UA','UKR'),
  ('Croatia','croatia','HR','HRV'),
  ('Serbia','serbia','RS','SRB'),
  ('Slovenia','slovenia','SI','SVN'),
  ('Bosnia and Herzegovina','bosnia-and-herzegovina','BA','BIH'),
  ('North Macedonia','north-macedonia','MK','MKD'),
  ('Albania','albania','AL','ALB'),
  ('Montenegro','montenegro','ME','MNE'),
  ('Kosovo','kosovo','XK','XKX'),
  ('Cyprus','cyprus','CY','CYP'),
  ('Malta','malta','MT','MLT'),
  ('Luxembourg','luxembourg','LU','LUX'),
  ('Israel','israel','IL','ISR'),
  ('Estonia','estonia','EE','EST'),
  ('Latvia','latvia','LV','LVA'),
  ('Lithuania','lithuania','LT','LTU'),
  ('Belarus','belarus','BY','BLR'),
  ('Moldova','moldova','MD','MDA'),
  ('Georgia','georgia','GE','GEO'),
  ('Armenia','armenia','AM','ARM'),
  ('Azerbaijan','azerbaijan','AZ','AZE'),
  ('Kazakhstan','kazakhstan','KZ','KAZ'),
  ('Andorra','andorra','AD','AND'),
  ('San Marino','san-marino','SM','SMR'),
  ('Liechtenstein','liechtenstein','LI','LIE'),
  ('Faroe Islands','faroe-islands','FO','FRO'),
  ('Gibraltar','gibraltar','GI','GIB')
) AS v(name, slug, iso2, iso3)
CROSS JOIN public.confederations c WHERE c.slug='uefa';

-- CONMEBOL
INSERT INTO public.countries(name, slug, iso2, iso3, confederation_id)
SELECT v.name, v.slug, v.iso2, v.iso3, c.id
FROM (VALUES
  ('Argentina','argentina','AR','ARG'),
  ('Brazil','brazil','BR','BRA'),
  ('Uruguay','uruguay','UY','URY'),
  ('Chile','chile','CL','CHL'),
  ('Colombia','colombia','CO','COL'),
  ('Peru','peru','PE','PER'),
  ('Ecuador','ecuador','EC','ECU'),
  ('Paraguay','paraguay','PY','PRY'),
  ('Bolivia','bolivia','BO','BOL'),
  ('Venezuela','venezuela','VE','VEN')
) AS v(name, slug, iso2, iso3)
CROSS JOIN public.confederations c WHERE c.slug='conmebol';

-- CONCACAF
INSERT INTO public.countries(name, slug, iso2, iso3, confederation_id)
SELECT v.name, v.slug, v.iso2, v.iso3, c.id
FROM (VALUES
  ('United States','united-states','US','USA'),
  ('Canada','canada','CA','CAN'),
  ('Mexico','mexico','MX','MEX'),
  ('Costa Rica','costa-rica','CR','CRI'),
  ('Honduras','honduras','HN','HND'),
  ('Panama','panama','PA','PAN'),
  ('El Salvador','el-salvador','SV','SLV'),
  ('Guatemala','guatemala','GT','GTM'),
  ('Jamaica','jamaica','JM','JAM'),
  ('Trinidad and Tobago','trinidad-and-tobago','TT','TTO'),
  ('Haiti','haiti','HT','HTI'),
  ('Cuba','cuba','CU','CUB'),
  ('Dominican Republic','dominican-republic','DO','DOM'),
  ('Nicaragua','nicaragua','NI','NIC'),
  ('Bermuda','bermuda','BM','BMU'),
  ('Curacao','curacao','CW','CUW')
) AS v(name, slug, iso2, iso3)
CROSS JOIN public.confederations c WHERE c.slug='concacaf';

-- AFC
INSERT INTO public.countries(name, slug, iso2, iso3, confederation_id)
SELECT v.name, v.slug, v.iso2, v.iso3, c.id
FROM (VALUES
  ('Japan','japan','JP','JPN'),
  ('South Korea','south-korea','KR','KOR'),
  ('China','china','CN','CHN'),
  ('Australia','australia','AU','AUS'),
  ('Saudi Arabia','saudi-arabia','SA','SAU'),
  ('Iran','iran','IR','IRN'),
  ('Iraq','iraq','IQ','IRQ'),
  ('Qatar','qatar','QA','QAT'),
  ('United Arab Emirates','united-arab-emirates','AE','ARE'),
  ('Bahrain','bahrain','BH','BHR'),
  ('Kuwait','kuwait','KW','KWT'),
  ('Oman','oman','OM','OMN'),
  ('Jordan','jordan','JO','JOR'),
  ('Lebanon','lebanon','LB','LBN'),
  ('Syria','syria','SY','SYR'),
  ('India','india','IN','IND'),
  ('Thailand','thailand','TH','THA'),
  ('Vietnam','vietnam','VN','VNM'),
  ('Indonesia','indonesia','ID','IDN'),
  ('Malaysia','malaysia','MY','MYS'),
  ('Singapore','singapore','SG','SGP'),
  ('Philippines','philippines','PH','PHL'),
  ('Uzbekistan','uzbekistan','UZ','UZB'),
  ('Tajikistan','tajikistan','TJ','TJK'),
  ('Turkmenistan','turkmenistan','TM','TKM'),
  ('Kyrgyzstan','kyrgyzstan','KG','KGZ'),
  ('Hong Kong','hong-kong','HK','HKG')
) AS v(name, slug, iso2, iso3)
CROSS JOIN public.confederations c WHERE c.slug='afc';

-- CAF
INSERT INTO public.countries(name, slug, iso2, iso3, confederation_id)
SELECT v.name, v.slug, v.iso2, v.iso3, c.id
FROM (VALUES
  ('Morocco','morocco','MA','MAR'),
  ('Egypt','egypt','EG','EGY'),
  ('Algeria','algeria','DZ','DZA'),
  ('Tunisia','tunisia','TN','TUN'),
  ('Senegal','senegal','SN','SEN'),
  ('Nigeria','nigeria','NG','NGA'),
  ('Ghana','ghana','GH','GHA'),
  ('Ivory Coast','ivory-coast','CI','CIV'),
  ('Cameroon','cameroon','CM','CMR'),
  ('South Africa','south-africa','ZA','ZAF'),
  ('Mali','mali','ML','MLI'),
  ('Burkina Faso','burkina-faso','BF','BFA'),
  ('DR Congo','dr-congo','CD','COD'),
  ('Congo','congo','CG','COG'),
  ('Kenya','kenya','KE','KEN'),
  ('Uganda','uganda','UG','UGA'),
  ('Ethiopia','ethiopia','ET','ETH'),
  ('Zambia','zambia','ZM','ZMB'),
  ('Zimbabwe','zimbabwe','ZW','ZWE'),
  ('Angola','angola','AO','AGO'),
  ('Guinea','guinea','GN','GIN'),
  ('Cape Verde','cape-verde','CV','CPV'),
  ('Gabon','gabon','GA','GAB'),
  ('Sudan','sudan','SD','SDN'),
  ('Libya','libya','LY','LBY'),
  ('Tanzania','tanzania','TZ','TZA'),
  ('Mauritania','mauritania','MR','MRT'),
  ('Madagascar','madagascar','MG','MDG'),
  ('Benin','benin','BJ','BEN'),
  ('Togo','togo','TG','TGO'),
  ('Sierra Leone','sierra-leone','SL','SLE'),
  ('Liberia','liberia','LR','LBR'),
  ('Niger','niger','NE','NER'),
  ('Mozambique','mozambique','MZ','MOZ'),
  ('Equatorial Guinea','equatorial-guinea','GQ','GNQ'),
  ('Comoros','comoros','KM','COM')
) AS v(name, slug, iso2, iso3)
CROSS JOIN public.confederations c WHERE c.slug='caf';

-- OFC
INSERT INTO public.countries(name, slug, iso2, iso3, confederation_id)
SELECT v.name, v.slug, v.iso2, v.iso3, c.id
FROM (VALUES
  ('New Zealand','new-zealand','NZ','NZL'),
  ('Fiji','fiji','FJ','FJI'),
  ('Papua New Guinea','papua-new-guinea','PG','PNG'),
  ('Solomon Islands','solomon-islands','SB','SLB'),
  ('Tahiti','tahiti',NULL,'TAH'),
  ('Vanuatu','vanuatu','VU','VUT'),
  ('New Caledonia','new-caledonia','NC','NCL'),
  ('Samoa','samoa','WS','WSM'),
  ('Tonga','tonga','TO','TON'),
  ('Cook Islands','cook-islands','CK','COK')
) AS v(name, slug, iso2, iso3)
CROSS JOIN public.confederations c WHERE c.slug='ofc';

-- 3) LEAGUES MASTER (extend league_publication) -------------------------------
ALTER TABLE public.league_publication
  ADD COLUMN IF NOT EXISTS country_id uuid REFERENCES public.countries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS confederation_id uuid REFERENCES public.confederations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_h1 text,
  ADD COLUMN IF NOT EXISTS seo_content text,
  ADD COLUMN IF NOT EXISTS tier_level integer,
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'men',
  ADD COLUMN IF NOT EXISTS league_type text NOT NULL DEFAULT 'domestic',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_league_publication_country_id
  ON public.league_publication(country_id);
CREATE INDEX IF NOT EXISTS idx_league_publication_confederation_id
  ON public.league_publication(confederation_id);

-- 4) COUNTRY NAME NORMALIZATION HELPER ----------------------------------------
CREATE OR REPLACE FUNCTION public.fn_resolve_country_id(p_name text)
RETURNS uuid LANGUAGE sql STABLE SET search_path = public AS $$
  WITH n AS (
    SELECT lower(btrim(p_name)) AS raw
  ), mapped AS (
    SELECT CASE raw
      WHEN 'espagne' THEN 'spain'
      WHEN 'usa' THEN 'united states'
      WHEN 'u.s.a.' THEN 'united states'
      WHEN 'united states of america' THEN 'united states'
      WHEN 'états-unis' THEN 'united states'
      WHEN 'etats-unis' THEN 'united states'
      WHEN 'angleterre' THEN 'england'
      WHEN 'écosse' THEN 'scotland'
      WHEN 'ecosse' THEN 'scotland'
      WHEN 'pays de galles' THEN 'wales'
      WHEN 'irlande du nord' THEN 'northern ireland'
      WHEN 'allemagne' THEN 'germany'
      WHEN 'italie' THEN 'italy'
      WHEN 'pays-bas' THEN 'netherlands'
      WHEN 'holland' THEN 'netherlands'
      WHEN 'belgique' THEN 'belgium'
      WHEN 'autriche' THEN 'austria'
      WHEN 'suisse' THEN 'switzerland'
      WHEN 'grèce' THEN 'greece'
      WHEN 'turquie' THEN 'turkey'
      WHEN 'pologne' THEN 'poland'
      WHEN 'republique tcheque' THEN 'czech republic'
      WHEN 'république tchèque' THEN 'czech republic'
      WHEN 'czechia' THEN 'czech republic'
      WHEN 'eire' THEN 'republic of ireland'
      WHEN 'ireland' THEN 'republic of ireland'
      ELSE raw
    END AS canon FROM n
  )
  SELECT c.id FROM public.countries c, mapped m
  WHERE lower(c.name) = m.canon
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.fn_resolve_country_id(text) TO anon, authenticated, service_role;

-- 5) AUTOMATIC LEAGUE BACKFILL ------------------------------------------------
WITH src AS (
  SELECT competition AS league_name, country FROM public.matches
   WHERE competition IS NOT NULL AND btrim(competition) <> ''
     AND competition <> 'FIFA World Cup 2026'
  UNION
  SELECT league, country FROM public.club_ticketing_profiles
   WHERE league IS NOT NULL AND btrim(league) <> ''
  UNION
  SELECT league, country FROM public.stadiums
   WHERE league IS NOT NULL AND btrim(league) <> ''
),
norm AS (
  SELECT
    btrim(league_name) AS league_name,
    CASE
      WHEN btrim(league_name) IN ('UEFA Champions League','UEFA Europa League',
                                  'UEFA Conference League','UEFA Super Cup',
                                  'UEFA Europa Conference League')
        THEN 'Europe'
      ELSE COALESCE(NULLIF(btrim(country),''), 'Unknown')
    END AS country_label,
    CASE
      WHEN btrim(league_name) LIKE 'UEFA %' THEN 'continental'
      WHEN btrim(league_name) ILIKE '%cup%' THEN 'cup'
      ELSE 'domestic'
    END AS league_type,
    CASE
      WHEN btrim(league_name) IN ('Premier League','La Liga','Ligue 1','Bundesliga',
                                  'Serie A','Primera Division','Premiership',
                                  'Superliga','Eredivisie','Primeira Liga',
                                  'Jupiler Pro League','Süper Lig','Super Lig') THEN 1
      WHEN btrim(league_name) IN ('Championship','Ligue 2','2. Bundesliga','Serie B',
                                  'La Liga 2','Segunda Division',
                                  'Challenger Pro League') THEN 2
      ELSE NULL
    END AS tier_level
  FROM src
)
INSERT INTO public.league_publication (
  league_name, country, slug,
  country_id, confederation_id,
  league_type, tier_level, division_level,
  publication_status, continent, is_active, gender
)
SELECT DISTINCT
  n.league_name,
  n.country_label,
  regexp_replace(lower(n.league_name), '[^a-z0-9]+', '-', 'g'),
  public.fn_resolve_country_id(n.country_label),
  CASE
    WHEN n.league_type = 'continental'
      THEN (SELECT id FROM public.confederations WHERE slug='uefa')
    ELSE (SELECT confederation_id FROM public.countries
            WHERE id = public.fn_resolve_country_id(n.country_label))
  END,
  n.league_type,
  n.tier_level,
  n.tier_level,
  'draft',
  CASE WHEN n.league_type = 'continental' THEN 'Europe' ELSE NULL END,
  true,
  'men'
FROM norm n
ON CONFLICT (league_name, country) DO NOTHING;

-- Backfill country_id / confederation_id on any league rows missing them
UPDATE public.league_publication lp
   SET country_id = public.fn_resolve_country_id(lp.country)
 WHERE lp.country_id IS NULL;

UPDATE public.league_publication lp
   SET confederation_id = c.confederation_id
  FROM public.countries c
 WHERE lp.confederation_id IS NULL
   AND lp.country_id = c.id;