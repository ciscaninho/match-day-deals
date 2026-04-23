
-- Roles infrastructure
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Assistant settings (single row, id=1)
CREATE TABLE IF NOT EXISTS public.assistant_settings (
  id int PRIMARY KEY DEFAULT 1,
  enabled boolean NOT NULL DEFAULT true,
  escalation_enabled boolean NOT NULL DEFAULT true,
  display_name text NOT NULL DEFAULT 'Ticket Assistant',
  greeting text NOT NULL DEFAULT 'Hi! I''m your Foot Ticket Assistant. Ask me anything about matches, tickets, alerts, premium, or the app.',
  fallback_message text NOT NULL DEFAULT 'I''m sorry, I couldn''t find a reliable answer to that question. I can send your message to our support team for review.',
  support_email text NOT NULL DEFAULT 'support@footticketfinder.com',
  email_subject text NOT NULL DEFAULT 'AI Support Escalation - Foot Ticket Finder',
  faq_seed text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);

ALTER TABLE public.assistant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read assistant settings"
  ON public.assistant_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update assistant settings"
  ON public.assistant_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.assistant_settings (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- Support escalations
CREATE TABLE IF NOT EXISTS public.support_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_message text NOT NULL,
  current_page text,
  related_match_id text,
  related_match_name text,
  language text,
  user_type text,
  escalation_status text NOT NULL DEFAULT 'pending',
  email_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an escalation"
  ON public.support_escalations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own escalations"
  ON public.support_escalations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all escalations"
  ON public.support_escalations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update escalations"
  ON public.support_escalations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
