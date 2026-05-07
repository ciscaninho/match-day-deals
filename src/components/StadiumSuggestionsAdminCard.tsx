import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox, Check, X, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";

interface Suggestion {
  id: string;
  stadium_name: string;
  club: string | null;
  city: string | null;
  country: string | null;
  league: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export const StadiumSuggestionsAdminCard = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-stadium-suggestions"],
    queryFn: async (): Promise<Suggestion[]> => {
      const { data } = await supabase
        .from("stadium_suggestions")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as Suggestion[];
    },
  });

  const updateStatus = async (id: string, status: "approved" | "rejected" | "duplicate") => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("stadium_suggestions")
      .update({
        status,
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    setUpdatingId(null);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-stadium-suggestions"] });
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Inbox className="w-4 h-4" /> Stadium suggestions
          <span className="ml-auto text-[10px] font-normal text-muted-foreground">
            {items.length} pending
          </span>
        </h3>
        {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
        {!isLoading && items.length === 0 && (
          <p className="text-xs text-muted-foreground">No pending suggestions.</p>
        )}
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="border border-border rounded-lg p-2.5 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{s.stadium_name}</span>
                <span className="text-muted-foreground text-[10px]">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                {[s.club, s.city, s.country, s.league].filter(Boolean).join(" · ") || "—"}
              </p>
              {s.notes && <p className="text-foreground/80 text-[11px] italic">{s.notes}</p>}
              <div className="flex gap-1.5 pt-1">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-[11px] gap-1"
                  disabled={updatingId === s.id}
                  onClick={() => updateStatus(s.id, "approved")}
                >
                  {updatingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] gap-1"
                  disabled={updatingId === s.id}
                  onClick={() => updateStatus(s.id, "duplicate")}
                >
                  <Copy className="w-3 h-3" /> Duplicate
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px] gap-1 text-destructive"
                  disabled={updatingId === s.id}
                  onClick={() => updateStatus(s.id, "rejected")}
                >
                  <X className="w-3 h-3" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
