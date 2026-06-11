import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  ChevronRight, Search, Users2, MapPin, Trophy, Globe2,
  CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import { toast } from "sonner";

type Confederation = { id: string; name: string; slug: string };
type Country = { id: string; name: string; slug: string; confederation_id: string | null };
type League = { id: string; league_name: string; slug: string; country_id: string | null; tier_level: number | null };
type Club = {
  id: string;
  slug: string;
  club_name: string;
  short_name: string | null;
  aliases: string[];
  country_id: string | null;
  primary_league_id: string | null;
  home_stadium_id: string | null;
  founded_year: number | null;
  crest_url: string | null;
  hero_image_url: string | null;
  official_website: string | null;
  gender: string;
  club_type: string;
  seo_title: string | null;
  seo_description: string | null;
  publication_status: string;
  archived_at: string | null;
};
type Stadium = { id: string; stadium_name: string; slug: string };
type ClubStadium = { id: string; club_id: string; stadium_id: string; role: string; is_current: boolean };

const AdminClubsMasterPage = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [openConfs, setOpenConfs] = useState<Set<string>>(new Set());
  const [openCountries, setOpenCountries] = useState<Set<string>>(new Set());
  const [openLeagues, setOpenLeagues] = useState<Set<string>>(new Set());
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-clubs-master"],
    queryFn: async () => {
      const [confs, countries, leagues, clubs, stadiums, hasTicketing, clubStadiums] = await Promise.all([
        supabase.from("confederations" as never).select("id,name,slug").order("name"),
        supabase.from("countries" as never).select("id,name,slug,confederation_id").order("name"),
        supabase.from("league_publication").select("id,league_name,slug,country_id,tier_level").order("league_name"),
        supabase.from("clubs" as never).select("*").is("archived_at", null).order("club_name"),
        supabase.from("stadiums").select("id,stadium_name,slug"),
        supabase.from("club_ticketing_profiles").select("club_id").not("club_id", "is", null),
        supabase.from("club_stadiums" as never).select("id,club_id,stadium_id,role,is_current"),
      ]);
      return {
        confederations: (confs.data ?? []) as Confederation[],
        countries: (countries.data ?? []) as Country[],
        leagues: (leagues.data ?? []) as League[],
        clubs: (clubs.data ?? []) as Club[],
        stadiums: (stadiums.data ?? []) as Stadium[],
        ticketingClubIds: new Set(((hasTicketing.data ?? []) as { club_id: string }[]).map(r => r.club_id)),
        clubStadiums: (clubStadiums.data ?? []) as ClubStadium[],
      };
    },
  });

  const idx = useMemo(() => {
    const stadiumById = new Map<string, Stadium>();
    (data?.stadiums ?? []).forEach(s => stadiumById.set(s.id, s));
    const leagueById = new Map<string, League>();
    (data?.leagues ?? []).forEach(l => leagueById.set(l.id, l));
    const countryById = new Map<string, Country>();
    (data?.countries ?? []).forEach(c => countryById.set(c.id, c));
    const confById = new Map<string, Confederation>();
    (data?.confederations ?? []).forEach(c => confById.set(c.id, c));
    return { stadiumById, leagueById, countryById, confById };
  }, [data]);

  const tree = useMemo(() => {
    if (!data) return [] as Array<{ conf: Confederation; countries: Array<{ country: Country; leagues: Array<{ league: League | null; clubs: Club[] }> }> }>;
    const q = search.trim().toLowerCase();
    const filteredClubs = q
      ? data.clubs.filter(c =>
          c.club_name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.short_name?.toLowerCase().includes(q) ?? false) ||
          c.aliases?.some(a => a.toLowerCase().includes(q))
        )
      : data.clubs;

    const byCountry = new Map<string, Club[]>();
    const orphans: Club[] = [];
    filteredClubs.forEach(c => {
      if (!c.country_id) { orphans.push(c); return; }
      if (!byCountry.has(c.country_id)) byCountry.set(c.country_id, []);
      byCountry.get(c.country_id)!.push(c);
    });

    const result: Array<{ conf: Confederation; countries: Array<{ country: Country; leagues: Array<{ league: League | null; clubs: Club[] }> }> }> = [];
    data.confederations.forEach(conf => {
      const confCountries = data.countries.filter(c => c.confederation_id === conf.id);
      const countriesNode: Array<{ country: Country; leagues: Array<{ league: League | null; clubs: Club[] }> }> = [];
      confCountries.forEach(country => {
        const cClubs = byCountry.get(country.id) ?? [];
        if (cClubs.length === 0 && q) return;
        const byLeague = new Map<string, Club[]>();
        const noLeague: Club[] = [];
        cClubs.forEach(c => {
          if (!c.primary_league_id) { noLeague.push(c); return; }
          if (!byLeague.has(c.primary_league_id)) byLeague.set(c.primary_league_id, []);
          byLeague.get(c.primary_league_id)!.push(c);
        });
        const leaguesNode: Array<{ league: League | null; clubs: Club[] }> = [];
        Array.from(byLeague.entries())
          .map(([lid, cl]) => ({ league: idx.leagueById.get(lid) ?? null, clubs: cl }))
          .sort((a, b) => (a.league?.tier_level ?? 99) - (b.league?.tier_level ?? 99))
          .forEach(n => leaguesNode.push(n));
        if (noLeague.length) leaguesNode.push({ league: null, clubs: noLeague });
        if (cClubs.length) countriesNode.push({ country, leagues: leaguesNode });
      });
      if (countriesNode.length) result.push({ conf, countries: countriesNode });
    });
    if (orphans.length) {
      result.push({
        conf: { id: "_no_conf", name: "Unassigned", slug: "_no_conf" },
        countries: [{
          country: { id: "_no_country", name: "No country", slug: "_no_country", confederation_id: null },
          leagues: [{ league: null, clubs: orphans }],
        }],
      });
    }
    return result;
  }, [data, search, idx]);

  const selectedClub = useMemo(
    () => (data?.clubs ?? []).find(c => c.id === selectedClubId) ?? null,
    [data, selectedClubId]
  );

  const totals = useMemo(() => {
    if (!data) return { clubs: 0, withTicketing: 0, identityOnly: 0, published: 0 };
    return {
      clubs: data.clubs.length,
      withTicketing: data.clubs.filter(c => data.ticketingClubIds.has(c.id)).length,
      identityOnly: data.clubs.filter(c => c.club_type === "identity_only").length,
      published: data.clubs.filter(c => c.publication_status === "published").length,
    };
  }, [data]);

  const toggle = (set: Set<string>, key: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key); else next.add(key);
    setter(next);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{t("admin.clubsMaster.title")}</h1>
          <p className="text-sm text-slate-500 truncate">{t("admin.clubsMaster.subtitle")}</p>
        </div>
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("admin.clubsMaster.search")}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Users2 className="h-4 w-4" />} label={t("admin.clubsMaster.kpi.total")} value={totals.clubs} />
        <Kpi icon={<CheckCircle2 className="h-4 w-4" />} label={t("admin.clubsMaster.kpi.withTicketing")} value={totals.withTicketing} />
        <Kpi icon={<AlertCircle className="h-4 w-4" />} label={t("admin.clubsMaster.kpi.identityOnly")} value={totals.identityOnly} />
        <Kpi icon={<Trophy className="h-4 w-4" />} label={t("admin.clubsMaster.kpi.published")} value={totals.published} />
      </div>

      <Card>
        <CardContent className="p-2 sm:p-3">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("admin.clubsMaster.loading")}
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map(({ conf, countries }) => {
                const confOpen = openConfs.has(conf.id) || search.trim().length > 0;
                const confClubCount = countries.reduce((acc, c) => acc + c.leagues.reduce((a, l) => a + l.clubs.length, 0), 0);
                return (
                  <div key={conf.id}>
                    <button
                      onClick={() => toggle(openConfs, conf.id, setOpenConfs)}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-slate-50 text-left"
                    >
                      <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ${confOpen ? "rotate-90" : ""}`} />
                      <Globe2 className="h-4 w-4 text-slate-500 shrink-0" />
                      <span className="font-semibold text-slate-900 truncate">{conf.name}</span>
                      <Badge variant="secondary" className="ml-auto shrink-0">{confClubCount}</Badge>
                    </button>
                    {confOpen && countries.map(({ country, leagues }) => {
                      const cKey = `${conf.id}:${country.id}`;
                      const cOpen = openCountries.has(cKey) || search.trim().length > 0;
                      const countryClubCount = leagues.reduce((a, l) => a + l.clubs.length, 0);
                      return (
                        <div key={cKey} className="ml-5">
                          <button
                            onClick={() => toggle(openCountries, cKey, setOpenCountries)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 text-left"
                          >
                            <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ${cOpen ? "rotate-90" : ""}`} />
                            <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="text-sm font-medium text-slate-800 truncate">{country.name}</span>
                            <Badge variant="outline" className="ml-auto text-[10px] shrink-0">{countryClubCount}</Badge>
                          </button>
                          {cOpen && leagues.map(({ league, clubs }) => {
                            const lKey = `${cKey}:${league?.id ?? "_no_league"}`;
                            const lOpen = openLeagues.has(lKey) || search.trim().length > 0;
                            return (
                              <div key={lKey} className="ml-5">
                                <button
                                  onClick={() => toggle(openLeagues, lKey, setOpenLeagues)}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 text-left"
                                >
                                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ${lOpen ? "rotate-90" : ""}`} />
                                  <Trophy className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                  <span className="text-sm text-slate-700 truncate">
                                    {league?.league_name ?? t("admin.clubsMaster.noLeague")}
                                  </span>
                                  <Badge variant="outline" className="ml-auto text-[10px] shrink-0">{clubs.length}</Badge>
                                </button>
                                {lOpen && (
                                  <ul className="ml-9 my-1 space-y-0.5">
                                    {clubs.map(club => {
                                      const hasTicketing = data!.ticketingClubIds.has(club.id);
                                      return (
                                        <li key={club.id}>
                                          <button
                                            onClick={() => setSelectedClubId(club.id)}
                                            className="w-full flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-100 text-left"
                                          >
                                            {club.crest_url ? (
                                              <img src={club.crest_url} alt="" className="h-4 w-4 object-contain shrink-0" />
                                            ) : (
                                              <Users2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            )}
                                            <span className="text-sm text-slate-800 truncate">{club.club_name}</span>
                                            {club.club_type === "identity_only" && (
                                              <Badge variant="outline" className="text-[10px] shrink-0">{t("admin.clubsMaster.identityOnlyTag")}</Badge>
                                            )}
                                            {hasTicketing && (
                                              <Badge variant="secondary" className="text-[10px] shrink-0">{t("admin.clubsMaster.ticketingTag")}</Badge>
                                            )}
                                            <Badge
                                              variant={club.publication_status === "published" ? "default" : "outline"}
                                              className="ml-auto text-[10px] shrink-0"
                                            >
                                              {club.publication_status}
                                            </Badge>
                                          </button>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {!tree.length && (
                <p className="p-6 text-center text-sm text-slate-500">{t("admin.clubsMaster.empty")}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedClub} onOpenChange={(o) => !o && setSelectedClubId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="truncate">{selectedClub?.club_name}</SheetTitle>
          </SheetHeader>
          {selectedClub && (
            <ClubDetail
              club={selectedClub}
              hasTicketing={data!.ticketingClubIds.has(selectedClub.id)}
              countryName={selectedClub.country_id ? idx.countryById.get(selectedClub.country_id)?.name ?? null : null}
              leagueName={selectedClub.primary_league_id ? idx.leagueById.get(selectedClub.primary_league_id)?.league_name ?? null : null}
              stadiumName={selectedClub.home_stadium_id ? idx.stadiumById.get(selectedClub.home_stadium_id)?.stadium_name ?? null : null}
              otherStadiums={(data!.clubStadiums ?? [])
                .filter(cs => cs.club_id === selectedClub.id && cs.stadium_id !== selectedClub.home_stadium_id)
                .map(cs => ({
                  role: cs.role,
                  name: idx.stadiumById.get(cs.stadium_id)?.stadium_name ?? cs.stadium_id,
                }))}
              onSaved={() => {
                qc.invalidateQueries({ queryKey: ["admin-clubs-master"] });
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const Kpi = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <Card>
    <CardContent className="p-3 flex items-center gap-3">
      <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-500 truncate">{label}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const ClubDetail = ({
  club, hasTicketing, countryName, leagueName, stadiumName, otherStadiums, onSaved,
}: {
  club: Club;
  hasTicketing: boolean;
  countryName: string | null;
  leagueName: string | null;
  stadiumName: string | null;
  otherStadiums: Array<{ role: string; name: string }>;
  onSaved: () => void;
}) => {
  const { t } = useLanguage();
  const [seoTitle, setSeoTitle] = useState(club.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(club.seo_description ?? "");
  const [publicationStatus, setPublicationStatus] = useState(club.publication_status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase.from("clubs" as never) as any)
      .update({
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        publication_status: publicationStatus,
      })
      .eq("id", club.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("admin.clubsMaster.saved"));
    onSaved();
  };

  return (
    <div className="mt-4 space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("admin.clubsMaster.field.country")} value={countryName ?? "—"} />
        <Field label={t("admin.clubsMaster.field.league")} value={leagueName ?? "—"} />
        <Field label={t("admin.clubsMaster.field.stadium")} value={stadiumName ?? "—"} />
        <Field label={t("admin.clubsMaster.field.type")} value={club.club_type} />
        <Field label={t("admin.clubsMaster.field.ticketing")} value={hasTicketing ? t("admin.clubsMaster.linked") : t("admin.clubsMaster.notLinked")} />
        <Field label={t("admin.clubsMaster.field.slug")} value={club.slug} />
      </div>

      {otherStadiums.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500 mb-1">{t("admin.clubsMaster.otherStadiums")}</p>
          <div className="flex flex-wrap gap-1.5">
            {otherStadiums.map((s, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">
                {s.name} · {s.role}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-slate-500">{t("admin.clubsMaster.seo")}</p>
        <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder={t("admin.clubsMaster.seoTitlePh")} />
        <Textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder={t("admin.clubsMaster.seoDescPh")} rows={3} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-slate-500">{t("admin.clubsMaster.publication")}</p>
        <div className="flex gap-2">
          {["draft", "published", "hidden"].map(s => (
            <Button
              key={s}
              size="sm"
              variant={publicationStatus === s ? "default" : "outline"}
              onClick={() => setPublicationStatus(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="w-full">
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {t("admin.clubsMaster.save")}
      </Button>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <p className="text-[10px] uppercase tracking-wide text-slate-500 truncate">{label}</p>
    <p className="text-sm text-slate-900 truncate">{value}</p>
  </div>
);

export default AdminClubsMasterPage;
