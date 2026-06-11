CREATE OR REPLACE FUNCTION public.fn_resolve_country_id(p_name text)
RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH n AS (SELECT lower(btrim(p_name)) AS raw),
  mapped AS (
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
  SELECT c.id FROM public.countries c, mapped m WHERE lower(c.name)=m.canon LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_resolve_country_id(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_resolve_country_id(text) TO service_role;