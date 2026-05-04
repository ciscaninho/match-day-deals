import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Bell, Heart, TrendingDown, Check, Zap, ArrowRight, X } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useAuthGate } from "@/components/auth/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

export type TrackIntent = "track" | "save" | "alerts";

interface OpenOptions {
  intent?: TrackIntent;
  matchId: string;
  matchLabel?: string;
}

interface TrackSheetContextValue {
  openTrackSheet: (options: OpenOptions) => void;
}

const TrackSheetContext = createContext<TrackSheetContextValue | null>(null);

const PENDING_KEY = "ftf_pending_track";

export const setPendingTrack = (data: { matchId: string; matchLabel?: string; intent: TrackIntent }) => {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(data));
  } catch {}
};

export const getPendingTrack = (): { matchId: string; matchLabel?: string; intent: TrackIntent } | null => {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearPendingTrack = () => {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {}
};

export const TrackPriceSheetProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { requireAuth } = useAuthGate();
  const { t, dir } = useLanguage();

  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<TrackIntent>("track");
  const [matchId, setMatchId] = useState<string>("");
  const [matchLabel, setMatchLabel] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const openTrackSheet = useCallback((options: OpenOptions) => {
    setIntent(options.intent ?? "track");
    setMatchId(options.matchId);
    setMatchLabel(options.matchLabel);
    setOpen(true);
  }, []);

  const handleStart = async () => {
    setSubmitting(true);
    setPendingTrack({ matchId, matchLabel, intent });

    if (!user) {
      setOpen(false);
      setSubmitting(false);
      requireAuth(
        () => navigate("/app/upsell"),
        { reason: t("track.auth.reason"), next: "/app/upsell" }
      );
      return;
    }

    const { error } = await supabase
      .from("saved_matches")
      .insert({ user_id: user.id, match_id: matchId, alerts_enabled: intent !== "save" });
    setSubmitting(false);

    if (error && !error.message.includes("duplicate")) {
      toast.error(t("track.toast.error"));
      return;
    }
    setOpen(false);
    toast.success(t("track.toast.success"));
    navigate("/app/upsell");
  };

  const badge = t(`track.badge.${intent}`);
  const title = t(`track.title.${intent}`);

  return (
    <TrackSheetContext.Provider value={{ openTrackSheet }}>
      {children}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[92vh]" dir={dir}>
          <div className="mx-auto w-full max-w-md">
            <DrawerHeader className="relative pt-6">
              <DrawerClose className={`absolute ${dir === "rtl" ? "left-4" : "right-4"} top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center`}>
                <X className="w-4 h-4 text-slate-600" />
              </DrawerClose>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#2ECC71]/10 border border-[#2ECC71]/25 px-3 py-1.5 text-[11px] font-bold text-[#27ae60] uppercase tracking-wider">
                {badge}
              </div>
              <DrawerTitle className="mt-3 text-2xl font-extrabold text-[#2C3E50] leading-tight" style={{ textAlign: dir === "rtl" ? "right" : "left" }}>
                {title}
              </DrawerTitle>
              <DrawerDescription className="mt-1 text-[#2C3E50]/65" style={{ textAlign: dir === "rtl" ? "right" : "left" }}>
                {t("track.description")}
              </DrawerDescription>
            </DrawerHeader>

            <div className="px-4 pb-2">
              <div className="rounded-2xl bg-gradient-to-br from-[#F0FFF6] to-white border border-[#2ECC71]/20 p-4">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#27ae60] uppercase tracking-wider">
                  <TrendingDown className="w-3.5 h-3.5" /> {t("track.proof.eyebrow")}
                </div>
                <div className="mt-1.5 flex items-baseline gap-2.5">
                  <span className="text-xl font-extrabold text-slate-400 line-through">€180</span>
                  <ArrowRight className={`w-4 h-4 text-[#2ECC71] ${dir === "rtl" ? "rotate-180" : ""}`} />
                  <span className="text-2xl font-extrabold text-[#2ECC71]">€120</span>
                  <span className="text-[10px] font-bold text-[#27ae60] bg-[#2ECC71]/15 rounded-full px-2 py-0.5">{t("track.proof.in_24h")}</span>
                </div>
              </div>

              <ul className="mt-4 space-y-2.5">
                {[
                  { icon: Bell, text: t("track.bullet.alerts") },
                  { icon: Heart, text: t("track.bullet.save") },
                  { icon: TrendingDown, text: t("track.bullet.best_time") },
                ].map(({ text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-[#2C3E50]">
                    <span className="w-7 h-7 rounded-full bg-[#2ECC71]/10 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[#27ae60]" strokeWidth={3} />
                    </span>
                    <span className="font-medium">{text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                <Zap className="w-3.5 h-3.5" /> {t("track.urgency")}
              </div>
            </div>

            <DrawerFooter className="pt-4">
              <button
                onClick={handleStart}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] disabled:opacity-60 text-white px-5 py-4 font-extrabold text-base transition shadow-lg shadow-[#2ECC71]/25"
              >
                <Bell className="w-4 h-4" /> {t("track.cta")}
              </button>
              <p className="text-center text-xs text-[#2C3E50]/55 font-medium">
                {t("track.cta.helper")}
              </p>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </TrackSheetContext.Provider>
  );
};

export const useTrackSheet = () => {
  const ctx = useContext(TrackSheetContext);
  if (!ctx) throw new Error("useTrackSheet must be used inside TrackPriceSheetProvider");
  return ctx;
};
