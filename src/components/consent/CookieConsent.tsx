import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import {
  acceptAll,
  getConsent,
  hasDecided,
  onConsentChanged,
  onOpenPreferences,
  rejectNonEssential,
  setConsent,
  type ConsentState,
} from "@/lib/consent";

/**
 * GDPR cookie consent banner + preferences modal.
 *
 * - Mounted once at the app root.
 * - First visit: banner appears with Accept all / Reject non-essential / Customize.
 * - Decision persisted; banner hidden on subsequent visits.
 * - Reopenable from the footer "Cookie preferences" link via the
 *   `ftf:open-cookie-preferences` window event.
 */
export const CookieConsent = () => {
  const [decided, setDecided] = useState<boolean>(true); // assume decided to avoid SSR flash
  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState<Pick<ConsentState, "analytics" | "marketing">>({
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    setDecided(hasDecided());
    const c = getConsent();
    setDraft({ analytics: c.analytics, marketing: c.marketing });
    const off1 = onConsentChanged((s) => {
      setDecided(s.decidedAt !== null);
      setDraft({ analytics: s.analytics, marketing: s.marketing });
    });
    const off2 = onOpenPreferences(() => {
      const cur = getConsent();
      setDraft({ analytics: cur.analytics, marketing: cur.marketing });
      setShowModal(true);
    });
    return () => {
      off1();
      off2();
    };
  }, []);

  const handleAcceptAll = () => acceptAll();
  const handleRejectAll = () => rejectNonEssential();
  const handleSavePrefs = () => {
    setConsent(draft);
    setShowModal(false);
  };

  const showBanner = !decided && !showModal;

  return (
    <>
      {showBanner && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed bottom-0 inset-x-0 z-[60] p-3 sm:p-5"
        >
          <div className="max-w-5xl mx-auto bg-white text-[#2C3E50] shadow-2xl ring-1 ring-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-[#2ECC71]/10 flex items-center justify-center">
                <Cookie className="w-5 h-5 text-[#2ECC71]" />
              </div>
              <div className="text-sm leading-relaxed">
                <p className="font-semibold mb-1">We value your privacy</p>
                <p className="text-[#2C3E50]/75">
                  We use essential cookies to run the site. With your consent we also use analytics
                  and marketing cookies to understand traffic and improve our service. You can
                  change your choice anytime from the footer.{" "}
                  <Link to="/cookies" className="text-[#2ECC71] hover:underline font-medium">
                    Read our Cookie Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={handleRejectAll}
                className="px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Reject non-essential
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-[#2ECC71] text-white hover:bg-[#27ae60] transition-colors"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cookie preferences"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white text-[#2C3E50] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-extrabold">Cookie preferences</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close"
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 text-sm">
              <p className="text-[#2C3E50]/70">
                Choose which categories of cookies you allow. Essential cookies are always on
                because the site cannot function without them.
              </p>

              <CategoryRow
                title="Essential cookies"
                description="Required for core functionality: navigation, authentication, security and saved preferences. These cannot be turned off."
                checked
                disabled
                onChange={() => undefined}
              />

              <CategoryRow
                title="Analytics cookies"
                description="Help us understand which pages are popular and how visitors use the site, so we can improve the experience. Aggregated, never sold."
                checked={draft.analytics}
                onChange={(v) => setDraft((d) => ({ ...d, analytics: v }))}
              />

              <CategoryRow
                title="Marketing cookies"
                description="Used to measure campaign performance and to attribute affiliate ticket clicks back to the partner that referred you."
                checked={draft.marketing}
                onChange={(v) => setDraft((d) => ({ ...d, marketing: v }))}
              />
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  handleRejectAll();
                  setShowModal(false);
                }}
                className="px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Reject non-essential
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAcceptAll();
                  setShowModal(false);
                }}
                className="px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={handleSavePrefs}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-[#2ECC71] text-white hover:bg-[#27ae60] transition-colors"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface RowProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}

const CategoryRow = ({ title, description, checked, disabled, onChange }: RowProps) => (
  <div className="rounded-xl border border-slate-200 p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-[#2C3E50]/65 mt-1 leading-relaxed">{description}</p>
      </div>
      <label className={`relative inline-flex items-center cursor-pointer ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-slate-200 peer-checked:bg-[#2ECC71] rounded-full peer-focus:ring-2 peer-focus:ring-[#2ECC71]/40 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5" />
      </label>
    </div>
  </div>
);

export default CookieConsent;
