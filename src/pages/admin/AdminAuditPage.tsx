import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Loader2, Undo2, ShieldCheck, XCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  proposed: "bg-amber-100 text-amber-800 border-amber-300",
  executed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  rejected: "bg-slate-200 text-slate-700 border-slate-300",
  rolled_back: "bg-blue-100 text-blue-800 border-blue-300",
  failed: "bg-red-100 text-red-800 border-red-300",
};

export const AdminAuditPage = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["admin-actions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_actions")
        .select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const run = async (id: string, mode: "execute" | "reject" | "rollback") => {
    setPending(id + mode);
    try {
      const { data, error } = await supabase.functions.invoke("admin-actions-execute", {
        body: { action_id: id, mode },
        headers: { "x-locale": t("admin.nav.audit") === "Journal d'audit" ? "fr" : "en" },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success(t(`admin.audit.${mode}_ok`));
      qc.invalidateQueries({ queryKey: ["admin-actions"] });
      qc.invalidateQueries({ queryKey: ["admin-stadiums-v2"] });
    } catch (e: any) {
      toast.error(e?.message || t("admin.audit.error"));
    } finally { setPending(null); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" /> {t("admin.audit.title")}
        </h1>
        <p className="text-sm text-slate-600 mt-1">{t("admin.audit.subtitle")}</p>
      </header>

      {isLoading && <div className="flex items-center gap-2 text-slate-600"><Loader2 className="w-4 h-4 animate-spin" /> {t("admin.loading")}</div>}

      <div className="space-y-3">
        {actions.map((a: any) => (
          <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[a.status] || ""}`}>{a.status}</span>
                  <code className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{a.kind}</code>
                  <span className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</span>
                </div>
                <pre className="mt-2 text-xs text-slate-700 bg-slate-50 rounded p-2 overflow-x-auto max-h-40">{JSON.stringify(a.result || a.preview || a.payload, null, 2)}</pre>
                {a.error && <p className="text-xs text-red-700 mt-2 font-semibold">{a.error}</p>}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {a.status === "proposed" && (
                  <>
                    <Button size="sm" onClick={() => run(a.id, "execute")} disabled={!!pending} className="bg-emerald-600 hover:bg-emerald-700">
                      {pending === a.id + "execute" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />} {t("admin.audit.approve")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => run(a.id, "reject")} disabled={!!pending}>
                      <XCircle className="w-3 h-3 mr-1" /> {t("admin.audit.reject")}
                    </Button>
                  </>
                )}
                {a.status === "executed" && (
                  <Button size="sm" variant="outline" onClick={() => run(a.id, "rollback")} disabled={!!pending}>
                    {pending === a.id + "rollback" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Undo2 className="w-3 h-3 mr-1" />} {t("admin.audit.rollback")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        {!isLoading && actions.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl">{t("admin.audit.empty")}</div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditPage;
