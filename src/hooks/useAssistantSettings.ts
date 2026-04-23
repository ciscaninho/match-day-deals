import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AssistantSettings {
  id: number;
  enabled: boolean;
  escalation_enabled: boolean;
  display_name: string;
  greeting: string;
  fallback_message: string;
  support_email: string;
  email_subject: string;
  faq_seed: string;
}

const DEFAULTS: AssistantSettings = {
  id: 1,
  enabled: true,
  escalation_enabled: true,
  display_name: "Ticket Assistant",
  greeting:
    "Hi! I'm your Foot Ticket Assistant. Ask me anything about matches, tickets, alerts, premium, or the app.",
  fallback_message:
    "I'm sorry, I couldn't find a reliable answer to that question. I can send your message to our support team for review.",
  support_email: "support@footticketfinder.com",
  email_subject: "AI Support Escalation - Foot Ticket Finder",
  faq_seed: "",
};

export const useAssistantSettings = () => {
  const [settings, setSettings] = useState<AssistantSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data } = await supabase
      .from("assistant_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (data) setSettings(data as AssistantSettings);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return { settings, loading, refresh };
};
