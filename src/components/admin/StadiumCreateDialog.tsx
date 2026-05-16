import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X, AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { foldText, slugify } from "@/lib/normalize";

export type StadiumCreatePrefill = Partial<{
  stadium_name: string;
  city: string;
  country: string;
  league: string;
}>;

export type StadiumCreated = {
  id: string;
  slug: string;
  stadium_name: string;
  city: string | null;
  country: string | null;
  league: string | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  prefill?: StadiumCreatePrefill;
  onCreated?: (stadium: StadiumCreated) => void;
}

const norm = (s: string) => foldText(s);

type DupRow = { slug: string; stadium_name: string; city: string | null; country: string | null; aliases: string[] | null; archived_at: string | null };

export const StadiumCreateDialog = ({ open, onClose, prefill, onCreated }: Props) => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [league, setLeague] = useState("");
  const [capacity, setCapacity] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [heroUrl, setHeroUrl] = useState("");
  const [aliases, setAliases] = useState("");
  const [saving, setSaving] = useState(false);
  const [allStadiums, setAllStadiums] = useState<DupRow[]>([]);
  const debounceRef = useRef<number | null>(null);
  const [slugTaken, setSlugTaken] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(prefill?.stadium_name || "");
    setSlug(prefill?.stadium_name ? slugify(prefill.stadium_name) : "");
    setSlugDirty(false);
    setCountry(prefill?.country || "");
    setCity(prefill?.city || "");
    setLeague(prefill?.league || "");
    setCapacity("");
    setLatitude("");
    setLongitude("");
    setHeroUrl("");
    setAliases("");
    setSlugTaken(false);
    // Prefetch stadiums for duplicate detection
    (async () => {
      const { data } = await supabase
        .from("stadiums")
        .select("slug,stadium_name,city,country,aliases,archived_at")
        .limit(3000);
      setAllStadiums((data || []) as DupRow[]);
    })();
  }, [open, prefill]);

  useEffect(() => {
    if (!slugDirty) setSlug(slugify(name));
  }, [name, slugDirty]);

  // Duplicate detection: same country + name similarity / alias match
  const duplicates = useMemo(() => {
    if (!name.trim()) return [];
    const n = norm(name);
    const c = norm(country);
    return allStadiums
      .filter((s) => !s.archived_at)
      .filter((s) => {
        const sName = norm(s.stadium_name);
        const aliasHit = (s.aliases || []).some((a) => norm(a) === n);
        const sameName = sName === n || sName.includes(n) || n.includes(sName);
        if (!sameName && !aliasHit) return false;
        // Country-aware: if country provided, downrank cross-country matches
        if (c && s.country && norm(s.country) !== c) return false;
        return true;
      })
      .slice(0, 5);
  }, [name, country, allStadiums]);

  // Slug collision check (debounced)
  useEffect(() => {
    if (!slug) { setSlugTaken(false); return; }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const { data } = await supabase.from("stadiums").select("slug").eq("slug", slug).maybeSingle();
      setSlugTaken(!!data);
    }, 300);
  }, [slug]);

  // Alias suggestions from common variations
  const aliasSuggestions = useMemo(() => {
    if (!name.trim()) return [];
    const base = name.trim();
    const suggestions = new Set<string>();
    suggestions.add(base.replace(/\bstadium\b/gi, "Stadion"));
    suggestions.add(base.replace(/\bstadion\b/gi, "Stadium"));
    suggestions.add(base.replace(/\barena\b/gi, "Stadion"));
    if (city) suggestions.add(`${base} (${city})`);
    return Array.from(suggestions).filter((s) => s !== base).slice(0, 3);
  }, [name, city]);

  const canSave = !!name.trim() && !!slug.trim() && !!country.trim() && !!city.trim() && !slugTaken && !saving;

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    const aliasArray = aliases.split(",").map((a) => a.trim()).filter(Boolean);
    const payload: any = {
      stadium_name: name.trim(),
      slug: slug.trim(),
      country: country.trim(),
      city: city.trim(),
      league: league.trim() || "—",
      aliases: aliasArray,
      publication_status: "draft",
    };
    if (capacity) payload.capacity = Number(capacity);
    if (latitude) payload.latitude = Number(latitude);
    if (longitude) payload.longitude = Number(longitude);
    if (heroUrl) payload.hero_image_url = heroUrl.trim();

    const { data, error } = await supabase
      .from("stadiums")
      .insert(payload)
      .select("id,slug,stadium_name,city,country,league")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("admin.create.stadium.created") || "Stadium created");
    onCreated?.(data as StadiumCreated);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white h-full overflow-y-auto p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-[#2C3E50] flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            {t("admin.create.stadium.title") || "Create stadium"}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        <p className="text-[11px] text-slate-500 mb-4">{t("admin.create.stadium.hint") || "New stadiums are created as draft. Move to verified/published from the stadium card."}</p>

        <div className="space-y-3">
          <Field label={t("admin.create.field.name") || "Name *"}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Europa-Park Stadion" />
          </Field>

          <Field label={t("admin.create.field.slug") || "Slug *"}>
            <Input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugDirty(true); }} />
            {slugTaken && (
              <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t("admin.create.slug.taken") || "Slug already in use."}</p>
            )}
            {!slugTaken && slug && (
              <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t("admin.create.slug.ok") || "Slug available."}</p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label={t("admin.create.field.country") || "Country *"}>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Germany" />
            </Field>
            <Field label={t("admin.create.field.city") || "City *"}>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Freiburg" />
            </Field>
          </div>

          <Field label={t("admin.create.field.league") || "League"}>
            <Input value={league} onChange={(e) => setLeague(e.target.value)} placeholder="Bundesliga" />
          </Field>

          <div className="grid grid-cols-3 gap-2">
            <Field label={t("admin.create.field.capacity") || "Capacity"}>
              <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </Field>
            <Field label="Lat">
              <Input type="number" value={latitude} onChange={(e) => setLatitude(e.target.value)} step="any" />
            </Field>
            <Field label="Lng">
              <Input type="number" value={longitude} onChange={(e) => setLongitude(e.target.value)} step="any" />
            </Field>
          </div>

          <Field label={t("admin.create.field.hero") || "Hero image URL"}>
            <Input value={heroUrl} onChange={(e) => setHeroUrl(e.target.value)} placeholder="https://…" />
          </Field>

          <Field label={t("admin.create.field.aliases") || "Aliases (comma separated)"}>
            <Textarea value={aliases} onChange={(e) => setAliases(e.target.value)} rows={2} placeholder="Schwarzwald-Stadion, SC-Stadion" />
            {aliasSuggestions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {aliasSuggestions.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAliases((prev) => prev ? `${prev}, ${a}` : a)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-700"
                  >
                    + {a}
                  </button>
                ))}
              </div>
            )}
          </Field>
        </div>

        {duplicates.length > 0 && (
          <div className="mt-4 p-3 rounded-lg border border-amber-300 bg-amber-50">
            <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t("admin.create.duplicates") || "Possible duplicates found"} ({duplicates.length})
            </p>
            <div className="space-y-1">
              {duplicates.map((d) => (
                <div key={d.slug} className="text-[11px] bg-white rounded p-1.5 border border-amber-200">
                  <span className="font-bold">{d.stadium_name}</span>
                  <span className="text-slate-500"> · {d.city || "?"}, {d.country || "?"} · </span>
                  <code className="text-emerald-700">{d.slug}</code>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-amber-700 mt-2">
              {t("admin.create.duplicates.hint") || "Review these first. If one matches, cancel and edit the existing record instead."}
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <Button onClick={submit} disabled={!canSave} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            {t("admin.create.stadium.submit") || "Create as draft"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("admin.cancel") || "Cancel"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-600 mb-1">{label}</label>
    {children}
  </div>
);
