import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reason?: string;
  onAuthenticated?: () => void;
}

export const AuthModal = ({ open, onOpenChange, reason, onAuthenticated }: Props) => {
  const { t, dir } = useLanguage();
  const [tab, setTab] = useState<"signin" | "signup">("signup");
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/app/home` },
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setMagicSent(true);
    toast.success(t("auth.magic.success_toast"));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/app/home` },
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    if (data.session) {
      toast.success(t("auth.signup.welcome"));
      onOpenChange(false);
      onAuthenticated?.();
    } else {
      toast.success(t("auth.signup.created"));
      setTab("signin");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("auth.signin.welcome_back"));
    onOpenChange(false);
    onAuthenticated?.();
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/app/home`,
    });
    if (result.error) { toast.error(t("auth.google.failed")); return; }
    if (result.redirected) return;
    onOpenChange(false);
    onAuthenticated?.();
  };

  const subtitle = reason
    ? t("auth.subtitle_with_reason", { reason })
    : t("auth.subtitle");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={dir}>
        <DialogHeader>
          <DialogTitle>{t("auth.title")}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <Button type="button" variant="outline" onClick={handleGoogle} className="w-full h-12 font-semibold text-base">
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.37-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
          </svg>
          {t("auth.continue_google")}
        </Button>

        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">{t("auth.divider_or")}</span></div>
        </div>

        {mode === "magic" ? (
          magicSent ? (
            <div className="rounded-xl border border-[#2ECC71]/30 bg-[#2ECC71]/5 p-4 text-center">
              <p className="text-sm font-bold text-[#2C3E50]">{t("auth.magic.sent_title")}</p>
              <p className="text-xs text-[#2C3E50]/65 mt-1">{t("auth.magic.sent_desc", { email })}</p>
              <button
                type="button"
                onClick={() => { setMagicSent(false); setEmail(""); }}
                className="mt-3 text-xs font-semibold text-[#2ECC71] hover:underline"
              >
                {t("auth.magic.different")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ml-email">{t("auth.email")}</Label>
                <Input id="ml-email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
              </div>
              <Button type="submit" disabled={submitting} className="h-12 font-semibold text-base">
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {t("auth.continue")}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">{t("auth.magic.helper")}</p>
              <button type="button" onClick={() => setMode("password")} className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                {t("auth.magic.use_password")}
              </button>
            </form>
          )
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signup">{t("auth.tab.signup")}</TabsTrigger>
              <TabsTrigger value="signin">{t("auth.tab.signin")}</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="flex flex-col gap-3 mt-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="su-email">{t("auth.email")}</Label>
                  <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="su-password">{t("auth.password")}</Label>
                  <Input id="su-password" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
                  <p className="text-xs text-muted-foreground">{t("auth.password_min")}</p>
                </div>
                <Button type="submit" disabled={submitting} className="h-11 font-semibold">
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {t("auth.signup.cta")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="flex flex-col gap-3 mt-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="si-email">{t("auth.email")}</Label>
                  <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="si-password">{t("auth.password")}</Label>
                  <Input id="si-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={submitting} className="h-11 font-semibold">
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {t("auth.signin.cta")}
                </Button>
              </form>
            </TabsContent>

            <button type="button" onClick={() => setMode("magic")} className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline mt-2 mx-auto block">
              {t("auth.magic.use_magic")}
            </button>
          </Tabs>
        )}

        <p className="text-[11px] text-muted-foreground text-center mt-2">{t("auth.terms")}</p>
      </DialogContent>
    </Dialog>
  );
};
