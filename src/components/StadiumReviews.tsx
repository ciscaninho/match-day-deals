import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import {
  MessageSquare, Sparkles, Users, Lightbulb, Send, Loader2, Star,
} from "lucide-react";

// Football icon (mini) used as the rating unit
const Ball = ({ filled, className = "" }: { filled: boolean; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={`transition-all duration-200 ${filled ? "text-[#2ECC71] drop-shadow-[0_0_6px_rgba(46,204,113,0.55)]" : "text-white/25"} ${className}`}
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" opacity={filled ? 0.18 : 0.08} />
    <path
      d="M12 4l2.6 1.9-1 3.1h-3.2l-1-3.1L12 4zm-6.5 5.5L8 11l-.6 3-2.7.9-1.5-2.4 2.3-3zm13 0l2.3 3-1.5 2.4-2.7-.9L16 11l2.5-1.5zM9 16h6l1.4 3-2.6 1.9h-3.6L7.6 19 9 16z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

const CATS = [
  { key: "atmosphere", labelKey: "stadium_reviews.cat_atmosphere" },
  { key: "view_rating", labelKey: "stadium_reviews.cat_view" },
  { key: "facilities", labelKey: "stadium_reviews.cat_facilities" },
  { key: "accessibility", labelKey: "stadium_reviews.cat_accessibility" },
  { key: "value", labelKey: "stadium_reviews.cat_value" },
] as const;

type CatKey = (typeof CATS)[number]["key"];

type Review = {
  id: string;
  user_id: string;
  stadium_slug: string;
  atmosphere: number;
  view_rating: number;
  facilities: number;
  accessibility: number;
  value: number;
  comment: string | null;
  section: string | null;
  created_at: string;
};

type Tip = { id: string; tip: string; created_at: string; upvotes: number };

const slugifyStadium = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const Rating = ({
  value, onChange, readOnly = false, size = 18,
}: { value: number; onChange?: (n: number) => void; readOnly?: boolean; size?: number }) => {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onClick={() => !readOnly && onChange?.(n)}
          className={`${readOnly ? "cursor-default" : "cursor-pointer hover:scale-125"} transition-transform p-0.5`}
          aria-label={`${n}`}
        >
          <Ball filled={n <= display} className={`w-[${size}px] h-[${size}px]`} />
        </button>
      ))}
    </div>
  );
};

export const StadiumReviews = ({ stadium, matchDate }: { stadium: string; matchDate?: string }) => {
  const slug = useMemo(() => slugifyStadium(stadium), [stadium]);
  const { user } = useAuth();
  const { t } = useLanguage();
  const tr = (k: string, p?: Record<string, string | number>) => t(`stadium_reviews.${k}`, p);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [ratings, setRatings] = useState<Record<CatKey, number>>({
    atmosphere: 0, view_rating: 0, facilities: 0, accessibility: 0, value: 0,
  });
  const [comment, setComment] = useState("");
  const [tipDraft, setTipDraft] = useState("");

  const matchPlayed = useMemo(() => {
    if (!matchDate) return true;
    return new Date(matchDate).getTime() <= Date.now();
  }, [matchDate]);

  const myReview = useMemo(
    () => (user ? reviews.find((r) => r.user_id === user.id) : null) ?? null,
    [reviews, user],
  );
  const isEditing = !!myReview;

  const load = async () => {
    setLoading(true);
    const [r, t] = await Promise.all([
      supabase.from("stadium_reviews").select("*").eq("stadium_slug", slug).order("created_at", { ascending: false }).limit(40),
      supabase.from("stadium_tips").select("*").eq("stadium_slug", slug).order("upvotes", { ascending: false }).limit(20),
    ]);
    if (r.data) setReviews(r.data as Review[]);
    if (t.data) setTips(t.data as Tip[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug]);

  // Prefill form when opening if user already has a review
  useEffect(() => {
    if (showForm && myReview) {
      setRatings({
        atmosphere: myReview.atmosphere,
        view_rating: myReview.view_rating,
        facilities: myReview.facilities,
        accessibility: myReview.accessibility,
        value: myReview.value,
      });
      setComment(myReview.comment ?? "");
    }
  }, [showForm, myReview]);

  const aggregates = useMemo(() => {
    if (!reviews.length) return null;
    const sum: Record<CatKey, number> = { atmosphere: 0, view_rating: 0, facilities: 0, accessibility: 0, value: 0 };
    reviews.forEach((r) => CATS.forEach((c) => (sum[c.key] += r[c.key] as number)));
    const avg = Object.fromEntries(CATS.map((c) => [c.key, sum[c.key] / reviews.length])) as Record<CatKey, number>;
    const total = (Object.values(avg).reduce((a, b) => a + b, 0)) / CATS.length;
    return { avg, total };
  }, [reviews]);

  const submitReview = async () => {
    if (!user) return toast.error(tr("sign_in_review"));
    if (!matchPlayed) return toast.error(tr("match_not_played"));
    if (CATS.some((c) => !ratings[c.key])) return toast.error(tr("rate_all_required"));
    setSubmitting(true);
    const { error } = await supabase.from("stadium_reviews").upsert({
      user_id: user.id,
      stadium_slug: slug,
      stadium_name: stadium,
      atmosphere: ratings.atmosphere,
      view_rating: ratings.view_rating,
      facilities: ratings.facilities,
      accessibility: ratings.accessibility,
      value: ratings.value,
      comment: comment.trim() || null,
    }, { onConflict: "user_id,stadium_slug" });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(tr("thanks"));
    setShowForm(false);
    load();
  };

  const submitTip = async () => {
    if (!user) return toast.error(tr("sign_in_tip"));
    if (!matchPlayed) return toast.error(tr("match_not_played"));
    const v = tipDraft.trim();
    if (v.length < 4) return toast.error(tr("tip_too_short"));
    const { error } = await supabase.from("stadium_tips").insert({
      user_id: user.id, stadium_slug: slug, tip: v,
    });
    if (error) return toast.error(error.message);
    setTipDraft("");
    toast.success(tr("tip_shared"));
    load();
  };

  const tipsCountLabel = tips.length === 1 ? tr("tip_count_one", { count: tips.length }) : tr("tip_count", { count: tips.length });
  const reviewsCountLabel = reviews.length === 1 ? tr("review_count_one", { count: reviews.length }) : tr("review_count", { count: reviews.length });
  const defaultTips = [tr("default_tip_1"), tr("default_tip_2"), tr("default_tip_3"), tr("default_tip_4")];

  return (
    <section className="max-w-5xl mx-auto px-5 pb-10">
      <div className="flex items-end justify-between mb-4 gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2ECC71]/15 border border-[#2ECC71]/30 px-2.5 py-1 text-[10px] font-bold text-[#2ECC71] uppercase tracking-wider">
            <Sparkles className="w-3 h-3" /> {tr("eyebrow")}
          </div>
          <h2 className="mt-2 text-xl md:text-2xl font-extrabold text-white">{tr("title")}</h2>
          <p className="text-sm text-white/55">{tr("subtitle")}</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          disabled={!matchPlayed}
          className="hidden md:inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed border border-white/15 px-3.5 py-2 text-xs font-bold text-white transition shrink-0"
        >
          <MessageSquare className="w-3.5 h-3.5" /> {showForm ? tr("close") : isEditing ? tr("edit_review") : tr("write_review")}
        </button>
      </div>

      {/* Match-not-played notice */}
      {!matchPlayed && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-xs text-white/70 flex items-start gap-2">
          <Star className="w-4 h-4 text-[#FFD93D] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-white">{tr("match_not_played")}</div>
            <div className="text-white/55">{tr("match_not_played_desc")}</div>
          </div>
        </div>
      )}

      {/* Score summary */}
      <div className="rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 p-5 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-white/50 text-sm"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {tr("loading")}</div>
        ) : !aggregates ? (
          <div className="text-center py-6">
            <Star className="w-7 h-7 text-white/30 mx-auto mb-2" />
            <p className="text-white/70 font-semibold">{tr("be_first")}</p>
            <p className="text-white/45 text-xs mt-1">{tr("be_first_desc")}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center">
            <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-1">
              <div className="text-5xl font-extrabold bg-gradient-to-br from-[#2ECC71] to-emerald-300 bg-clip-text text-transparent leading-none">
                {aggregates.total.toFixed(1)}
              </div>
              <div>
                <Rating value={Math.round(aggregates.total)} readOnly />
                <div className="text-[11px] text-white/55 mt-1 flex items-center gap-1"><Users className="w-3 h-3" /> {reviewsCountLabel}</div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {CATS.map((c) => {
                const v = aggregates.avg[c.key];
                return (
                  <div key={c.key} className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 gap-2">
                    <span className="text-xs font-semibold text-white/80 truncate">{t(c.labelKey)}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="h-1.5 w-16 sm:w-20 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#2ECC71] to-emerald-300" style={{ width: `${(v / 5) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-white tabular-nums w-7 text-right">{v.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mobile CTA */}
      <button
        onClick={() => setShowForm((s) => !s)}
        disabled={!matchPlayed}
        className="md:hidden mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed border border-white/15 px-3.5 py-2.5 text-xs font-bold text-white transition"
      >
        <MessageSquare className="w-3.5 h-3.5" /> {showForm ? tr("close") : isEditing ? tr("edit_review") : tr("write_review")}
      </button>

      {/* Review form */}
      {showForm && (
        <div className="mt-4 rounded-3xl bg-white/[0.04] border border-white/10 p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="font-extrabold text-white mb-3">{tr("rate_experience")}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {CATS.map((c) => (
              <div key={c.key} className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 gap-2">
                <span className="text-xs font-semibold text-white/85 truncate">{t(c.labelKey)}</span>
                <Rating value={ratings[c.key]} onChange={(n) => setRatings((p) => ({ ...p, [c.key]: n }))} />
              </div>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={tr("comment_placeholder")}
            rows={3}
            className="mt-3 w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#2ECC71]/40 resize-none"
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={submitReview}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] disabled:opacity-50 text-white px-4 py-2.5 text-sm font-extrabold transition"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {tr("submit")}
            </button>
          </div>
        </div>
      )}

      {/* Fan insights */}
      <div className="mt-5 rounded-3xl bg-white/[0.04] border border-white/10 p-5">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="inline-flex items-center gap-2 text-sm font-extrabold text-white">
            <Lightbulb className="w-4 h-4 text-[#FFD93D]" /> {tr("fan_insights")}
          </div>
          <span className="text-[11px] text-white/45 shrink-0">{tipsCountLabel}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {(tips.length ? tips.map((t) => t.tip) : defaultTips).map((text, i) => (
            <div key={`tip-${i}`} className="rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5 text-sm text-white/85 hover:border-[#2ECC71]/30 transition">
              <span className="text-[#2ECC71] mr-1.5">›</span>{text}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={tipDraft}
            onChange={(e) => setTipDraft(e.target.value)}
            maxLength={240}
            placeholder={tr("tip_placeholder")}
            className="flex-1 min-w-0 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#2ECC71]/40"
          />
          <button onClick={submitTip} className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 text-xs font-bold text-white transition shrink-0">{tr("post_tip")}</button>
        </div>
      </div>

      {/* Recent reviews */}
      {reviews.length > 0 && (
        <div className="mt-5 grid md:grid-cols-2 gap-3">
          {reviews.slice(0, 6).map((r) => {
            const total = (r.atmosphere + r.view_rating + r.facilities + r.accessibility + r.value) / 5;
            return (
              <div key={r.id} className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 hover:border-[#2ECC71]/30 transition">
                <div className="flex items-center justify-between">
                  <Rating value={Math.round(total)} readOnly size={14} />
                  <span className="text-[11px] text-white/45">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.comment && <p className="mt-2 text-sm text-white/85 leading-relaxed">{r.comment}</p>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};


export default StadiumReviews;
