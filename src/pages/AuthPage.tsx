import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/i18n/LanguageContext";

const AuthPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/";
  const { toast } = useToast();
  const { t, dir } = useLanguage();
  const { session, loading: sessionLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // Decide where to send the user after auth: onboarding if not completed.
  const goAfterAuth = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id;
    if (uid) {
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("onboarding_completed, onboarding_skipped_at")
        .eq("user_id", uid)
        .maybeSingle();
      if (prefs && !prefs.onboarding_completed && !prefs.onboarding_skipped_at) {
        navigate("/onboarding", { replace: true });
        return;
      }
    }
    navigate(next, { replace: true });
  };

  // Detect email confirmation redirect (Supabase returns tokens in URL hash with type=signup).
  useEffect(() => {
    const hash = window.location.hash || "";
    if (hash.includes("type=signup") || hash.includes("type=email_change")) {
      toast({
        title: t("auth.verified.title") || "Email verified",
        description: t("auth.verified.desc") || "Your email has been confirmed. Welcome!",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sessionLoading && session) {
      goAfterAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sessionLoading]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast({ title: t("auth.signin.error_title"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("auth.signin.welcome_back") });
    goAfterAuth();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(next)}` },
    });
    setSubmitting(false);
    if (error) {
      toast({ title: t("auth.signup.error_title"), description: error.message, variant: "destructive" });
      return;
    }
    if (data.session) {
      toast({ title: t("auth.signup.created"), description: t("auth.signup.personalize") });
      goAfterAuth();
    } else {
      // Email confirmation required → show "Check your email" screen
      setPendingVerification(email);
    }
  };

  const handleResendConfirmation = async () => {
    if (!pendingVerification) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingVerification,
      options: { emailRedirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(next)}` },
    });
    setResending(false);
    if (error) {
      toast({ title: t("auth.resend.error") || "Could not resend email", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: t("auth.resend.success") || "Email sent",
      description: (t("auth.resend.success_desc") || "We sent a new confirmation link to {email}.").replace("{email}", pendingVerification),
    });
  };


  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({ title: t("auth.forgot.sent_title"), description: t("auth.forgot.enter_email"), variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);

    if (error) {
      toast({ title: t("auth.reset.error_title"), description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: t("auth.forgot.sent_title"), description: t("auth.forgot.sent_desc", { email }) });
  };

  const handleGoogle = async () => {
    // IMPORTANT: always send Google back to /auth (with the original `next`
    // preserved) so the AuthPage useEffect can pick up the session and route
    // to the correct destination. Sending Google straight to a deep link can
    // land on a 404 if the route requires auth state that hasn't loaded yet
    // or doesn't exist on the published domain.
    const callback = `${window.location.origin}/auth?next=${encodeURIComponent(next)}`;
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: callback,
    });
    if (result.error) {
      toast({ title: t("auth.google.failed"), variant: "destructive" });
      return;
    }
    if (result.redirected) return;
    goAfterAuth();
  };

  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6" dir={dir}>
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <img src={logo} alt="Foot Ticket Finder" className="w-20 h-20 object-contain" />
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle>{t("auth.check_email.title") || "Check your email ✉️"}</CardTitle>
              <CardDescription>
                {(t("auth.check_email.desc") || "We sent a confirmation link to {email}. Click it to activate your account.").replace("{email}", pendingVerification)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button type="button" onClick={handleResendConfirmation} disabled={resending} className="h-11">
                {resending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("auth.check_email.resend") || "Resend confirmation email"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => {
                  setPendingVerification(null);
                  setPassword("");
                }}
              >
                {t("auth.check_email.use_different") || "Use a different email"}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {t("auth.check_email.spam") || "Didn't get it? Check your spam folder."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-background flex items-center justify-center px-6" dir={dir}>
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <img src={logo} alt="Foot Ticket Finder" className="w-20 h-20 object-contain" />
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>{t("auth.page.title")}</CardTitle>
            <CardDescription>{t("auth.page.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogle}
              className="w-full h-11 font-semibold mb-3"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.37-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              {t("auth.continue_google")}
            </Button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">{t("auth.divider_or")}</span></div>
            </div>

            <Tabs defaultValue="signup" className="w-full">
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="signup">{t("auth.tab.signup")}</TabsTrigger>
                <TabsTrigger value="signin">{t("auth.tab.signin")}</TabsTrigger>
              </TabsList>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signup-email">{t("auth.email")}</Label>
                    <Input id="signup-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signup-password">{t("auth.password")}</Label>
                    <Input id="signup-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
                    <p className="text-xs text-muted-foreground">{t("auth.password_min")}</p>
                  </div>
                  <Button type="submit" disabled={submitting} className="h-11">
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t("auth.signup.cta")}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signin-email">{t("auth.email")}</Label>
                    <Input id="signin-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="signin-password">{t("auth.password")}</Label>
                    <Input id="signin-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" variant="link" className="h-auto px-0 text-xs" onClick={handleForgotPassword}>
                      {t("auth.forgot.link")}
                    </Button>
                  </div>
                  <Button type="submit" disabled={submitting} className="h-11">
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t("auth.signin.cta")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground text-center">
          {t("auth.page.no_account_needed")}
        </p>
        <Link to="/auth" className="sr-only">{t("auth.reset.back_to_signin")}</Link>
      </div>
    </div>
  );
};

export default AuthPage;
