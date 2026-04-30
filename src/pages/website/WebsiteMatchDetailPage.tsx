import { Link, useParams } from "react-router-dom";
import { Calendar, MapPin, Trophy, ArrowRight, ExternalLink, ShieldCheck, BellRing, ArrowLeft, TrendingDown, Heart } from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useMatch } from "@/hooks/useMatches";
import { useTicketOffers } from "@/hooks/useTicketOffers";
import { useSEO, slugify } from "@/lib/seo";
import { usePremiumGate } from "@/components/premium/PremiumGate";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formatPrice = (price: number | null, currency: string) => {
  if (price == null) return "—";
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "USD" ? "$" : currency + " ";
  return `${symbol}${Number(price).toFixed(2)}`;
};

const WebsiteMatchDetailPage = () => {
  const { id } = useParams();
  const { data: match, isLoading } = useMatch(id);
  const { data: offers = [], isLoading: offersLoading } = useTicketOffers(id);
  const { requirePremium } = usePremiumGate();
  const { user } = useUser();

  const handleTrackPrice = () => {
    requirePremium(
      async () => {
        if (!user || !match) return;
        const { error } = await supabase
          .from("saved_matches")
          .insert({ user_id: user.id, match_id: match.id, alerts_enabled: true });
        if (error && !error.message.includes("duplicate")) {
          toast.error("Could not save match.");
          return;
        }
        toast.success("Tracking price for this match!");
      },
      { intent: "track" }
    );
  };

  const handleSaveMatch = () => {
    requirePremium(
      async () => {
        if (!user || !match) return;
        const { error } = await supabase
          .from("saved_matches")
          .insert({ user_id: user.id, match_id: match.id, alerts_enabled: false });
        if (error && !error.message.includes("duplicate")) {
          toast.error("Could not save match.");
          return;
        }
        toast.success("Saved to your favourites!");
      },
      { intent: "save" }
    );
  };

  const cheapest = offers.find((o) => o.price != null && o.inStock);
  const title = match
    ? `${match.homeTeam} vs ${match.awayTeam} tickets — ${match.competition} | Foot Ticket Finder`
    : "Match tickets | Foot Ticket Finder";
  const description = match
    ? `Compare ${match.homeTeam} vs ${match.awayTeam} ticket prices for the ${match.competition} on ${new Date(match.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} at ${match.stadium || match.city}. Official providers only.`
    : "Compare football ticket prices.";
  const canonical = match ? `https://footticketfinder.com/matches/${match.id}` : undefined;

  useSEO({
    title,
    description,
    canonical,
    jsonLd: match
      ? {
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          name: `${match.homeTeam} vs ${match.awayTeam}`,
          startDate: match.date,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: {
            "@type": "Place",
            name: match.stadium || match.city,
            address: { "@type": "PostalAddress", addressLocality: match.city, addressCountry: match.country },
          },
          homeTeam: { "@type": "SportsTeam", name: match.homeTeam },
          awayTeam: { "@type": "SportsTeam", name: match.awayTeam },
          ...(cheapest?.price != null
            ? {
                offers: {
                  "@type": "Offer",
                  price: cheapest.price,
                  priceCurrency: cheapest.currency,
                  availability: "https://schema.org/InStock",
                  url: cheapest.url,
                },
              }
            : {}),
        }
      : undefined,
  });

  if (isLoading) {
    return (
      <WebsiteLayout>
        <div className="max-w-4xl mx-auto px-5 py-20 text-center text-sm text-[#2C3E50]/60">Loading match…</div>
      </WebsiteLayout>
    );
  }

  if (!match) {
    return (
      <WebsiteLayout>
        <div className="max-w-4xl mx-auto px-5 py-20 text-center">
          <h1 className="text-2xl font-extrabold text-[#2C3E50]">Match not found</h1>
          <Link to="/matches" className="mt-4 inline-flex items-center gap-2 text-[#2ECC71] font-bold">
            <ArrowLeft className="w-4 h-4" /> Back to all matches
          </Link>
        </div>
      </WebsiteLayout>
    );
  }

  const fallbackOffers = match.ticketSources ?? [];

  return (
    <WebsiteLayout>
      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-5 pt-6 text-xs text-[#2C3E50]/55">
        <Link to="/" className="hover:text-[#2ECC71]">Home</Link>
        <span className="mx-1.5">/</span>
        <Link to="/matches" className="hover:text-[#2ECC71]">Matches</Link>
        <span className="mx-1.5">/</span>
        <Link to={`/leagues/${slugify(match.competition)}`} className="hover:text-[#2ECC71]">{match.competition}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-[#2C3E50]/80">{match.homeTeam} vs {match.awayTeam}</span>
      </div>

      {/* Match header */}
      <section className="max-w-5xl mx-auto px-5 pt-6 pb-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#2C3E50] via-[#243342] to-[#1a2530] text-white p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#2ECC71]/15 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#2ECC71]">
              <Trophy className="w-3.5 h-3.5" /> {match.competition}
            </span>
            <h1 className="mt-3 text-3xl md:text-5xl font-extrabold leading-tight">
              {match.homeTeam} <span className="text-white/40">vs</span> {match.awayTeam}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75">
              <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(match.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {new Date(match.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
              {(match.stadium || match.city) && (
                <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />{[match.stadium, match.city].filter(Boolean).join(", ")}</span>
              )}
            </div>

            {/* Premium CTAs */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleTrackPrice}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-5 py-2.5 font-bold text-sm transition shadow-lg shadow-[#2ECC71]/20"
              >
                <TrendingDown className="w-4 h-4" /> Track price
              </button>
              <button
                onClick={handleSaveMatch}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white px-5 py-2.5 font-bold text-sm transition"
              >
                <Heart className="w-4 h-4" /> Save match
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* spacer to keep original layout */}
      <div className="hidden">{`
{/* end hero */}`}</div>

      {/* OFFERS */}
      <section className="max-w-5xl mx-auto px-5 pb-16">
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-[#2C3E50]">Ticket offers</h2>
            <p className="text-sm text-[#2C3E50]/60 mt-1">Compare prices across official providers.</p>
          </div>
          {cheapest?.price != null && (
            <span className="text-xs font-bold rounded-full bg-[#2ECC71]/10 text-[#27ae60] border border-[#2ECC71]/20 px-3 py-1.5">
              Best price: {formatPrice(cheapest.price, cheapest.currency)}
            </span>
          )}
        </div>

        {offersLoading ? (
          <p className="text-sm text-[#2C3E50]/60">Loading offers…</p>
        ) : offers.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
            {offers.map((o) => (
              <div key={o.id} className="p-4 md:p-5 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-[180px]">
                  {o.providerLogo ? (
                    <img src={o.providerLogo} alt={o.provider} className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#2C3E50]/5 flex items-center justify-center text-xs font-extrabold text-[#2C3E50]">
                      {o.provider.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-[#2C3E50] text-sm">{o.provider}</p>
                    {o.category && <p className="text-xs text-[#2C3E50]/55">{o.category}</p>}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-extrabold text-[#2C3E50]">
                    {formatPrice(o.price, o.currency)}
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${o.inStock ? "text-[#27ae60]" : "text-red-500"}`}>
                    {o.inStock ? "Available" : "Sold out"}
                  </p>
                </div>

                <a
                  href={o.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-bold text-sm transition ${o.inStock ? "bg-[#2ECC71] hover:bg-[#27ae60] text-white" : "bg-slate-100 text-slate-400 pointer-events-none"}`}
                >
                  View tickets <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        ) : fallbackOffers.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
            {fallbackOffers.map((s, i) => (
              <div key={i} className="p-4 md:p-5 flex items-center gap-4 flex-wrap">
                <div className="flex-1">
                  <p className="font-bold text-[#2C3E50] text-sm">{s.name}</p>
                  <p className="text-xs text-[#2C3E50]/55 capitalize">{s.type} source{s.recommended ? " · Recommended" : ""}</p>
                </div>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-5 py-2.5 font-bold text-sm transition"
                >
                  View tickets <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm text-[#2C3E50]/65 max-w-md mx-auto">
              No offers available yet. Tickets typically open closer to the match — get notified the moment they go on sale.
            </p>
            <Link to="/app" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2C3E50] hover:bg-[#1f2d3a] text-white px-5 py-3 font-bold text-sm transition">
              <BellRing className="w-4 h-4" /> Set a price alert
            </Link>
          </div>
        )}

        {/* Trust + alert */}
        <div className="mt-10 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 p-6 bg-white">
            <ShieldCheck className="w-6 h-6 text-[#2ECC71]" />
            <h3 className="mt-3 font-extrabold text-[#2C3E50]">Buy with confidence</h3>
            <p className="mt-1 text-sm text-[#2C3E50]/65">All offers link directly to verified ticket platforms. We never charge a markup.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 bg-[#2C3E50] text-white">
            <BellRing className="w-6 h-6 text-[#2ECC71]" />
            <h3 className="mt-3 font-extrabold">Get a price alert</h3>
            <p className="mt-1 text-sm text-white/70">We'll notify you when the price drops or new tickets go on sale.</p>
            <Link to="/app" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#2ECC71]">
              Get the app <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
};

export default WebsiteMatchDetailPage;
