import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck, XCircle } from "lucide-react";

type Details = {
  client?: { name?: string; client_id?: string; redirect_uri?: string };
  scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
} | null;

const authOAuth = () => (supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
    approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
    denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  };
}).oauth;

export default function OAuthConsentPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const authorizationId = params.get("authorization_id") ?? "";
  const { session, loading: sessionLoading } = useAuth();
  const [details, setDetails] = useState<Details>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (sessionLoading) return;
    if (!authorizationId) {
      setError("Missing authorization_id");
      return;
    }
    if (!session) {
      const next = window.location.pathname + window.location.search;
      navigate(`/auth?next=${encodeURIComponent(next)}`, { replace: true });
      return;
    }
    let active = true;
    (async () => {
      const { data, error } = await authOAuth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message || "Could not load authorization request.");
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, session, sessionLoading, navigate]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await authOAuth().approveAuthorization(authorizationId)
      : await authOAuth().denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message || "Something went wrong.");
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("The authorization server did not return a redirect URL.");
      return;
    }
    window.location.href = target;
  };

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-2">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle>Authorization error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (sessionLoading || !details) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      </main>
    );
  }

  const clientName = details.client?.name ?? "an app";
  const email = session?.user?.email ?? "your account";

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <CardTitle>Connect {clientName} to Foot Ticket Finder</CardTitle>
          <CardDescription>
            {clientName} will be able to call Foot Ticket Finder tools as you ({email}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700 space-y-1">
            <p><strong>Search</strong> upcoming matches, stadiums and clubs.</p>
            <p><strong>View</strong> your saved matches and ticket alerts.</p>
            <p><strong>Save</strong> matches to your favorites and toggle alerts.</p>
          </div>
          <p className="text-xs text-slate-500">
            This does not bypass Foot Ticket Finder's permissions. {clientName} only sees data you can see.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => decide(true)}
              disabled={busy}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
            </Button>
            <Button variant="outline" onClick={() => decide(false)} disabled={busy} className="flex-1">
              Deny
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
