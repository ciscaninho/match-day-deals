// Edge function: proxies Ticketmaster Discovery API using server-side secret.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("TICKETMASTER_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ event: null, error: "missing_api_key" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let homeTeam = "";
    let awayTeam = "";
    if (req.method === "POST") {
      try {
        const body = await req.json();
        homeTeam = body?.homeTeam ?? "";
        awayTeam = body?.awayTeam ?? "";
      } catch {/* ignore */}
    } else {
      const url = new URL(req.url);
      homeTeam = url.searchParams.get("homeTeam") ?? "";
      awayTeam = url.searchParams.get("awayTeam") ?? "";
    }
    if (!homeTeam || !awayTeam) {
      return new Response(JSON.stringify({ event: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tmUrl = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    tmUrl.searchParams.set("keyword", `${homeTeam} ${awayTeam}`);
    tmUrl.searchParams.set("classificationName", "soccer");
    tmUrl.searchParams.set("size", "5");
    tmUrl.searchParams.set("sort", "date,asc");
    tmUrl.searchParams.set("apikey", apiKey);

    const res = await fetch(tmUrl.toString());
    if (!res.ok) {
      return new Response(JSON.stringify({ event: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const json = await res.json();
    const events = json?._embedded?.events as any[] | undefined;
    if (!events?.length) {
      return new Response(JSON.stringify({ event: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const home = homeTeam.toLowerCase();
    const away = awayTeam.toLowerCase();
    const best =
      events.find((e) => {
        const n = (e.name as string).toLowerCase();
        return n.includes(home) && n.includes(away);
      }) ?? events[0];

    const event = {
      id: best.id,
      name: best.name,
      url: best.url,
      date: best.dates?.start?.dateTime ?? best.dates?.start?.localDate,
      venue: best._embedded?.venues?.[0]?.name,
      city: best._embedded?.venues?.[0]?.city?.name,
      minPrice: best.priceRanges?.[0]?.min ?? null,
      currency: best.priceRanges?.[0]?.currency ?? null,
    };

    return new Response(JSON.stringify({ event }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ event: null, error: String(e) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
