import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ResetPasswordPage = () => {
  const { t, dir } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const verifyRecoverySession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const urlType = hashParams.get("type");
      const hasTokens = Boolean(hashParams.get("access_token") && hashParams.get("refresh_token"));

      if (!hasTokens && urlType !== "recovery") {
        if (mounted) {
          setIsRecoveryReady(false);
          setCheckingLink(false);
        }
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      setIsRecoveryReady(!error && !!data.session);
      setCheckingLink(false);
    };

    verifyRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: t("auth.reset.error_title"), description: t("auth.reset.mismatch"), variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast({ title: t("auth.reset.error_title"), description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: t("auth.reset.success_title"), description: t("auth.reset.success_desc") });
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" dir={dir}>
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <img src={logo} alt="Foot Ticket Finder" className="w-20 h-20 object-contain" />

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>{t("auth.reset.title")}</CardTitle>
            <CardDescription>
              {checkingLink
                ? t("auth.reset.loading")
                : isRecoveryReady
                  ? t("auth.reset.ready")
                  : t("auth.reset.invalid_desc")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {checkingLink ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : isRecoveryReady ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="reset-password">{t("auth.password")}</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{t("auth.password_min")}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="reset-password-confirm">{t("auth.reset.password_confirm")}</Label>
                  <Input
                    id="reset-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={submitting} className="h-11">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("auth.reset.submit")}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{t("auth.reset.invalid_title")}</p>
                  <p className="mt-1">{t("auth.reset.invalid_desc")}</p>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth">{t("auth.reset.back_to_signin")}</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;