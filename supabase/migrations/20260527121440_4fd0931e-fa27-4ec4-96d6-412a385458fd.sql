
CREATE TABLE IF NOT EXISTS public.wc_group_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_code TEXT NOT NULL,
  slot_position INT NOT NULL CHECK (slot_position BETWEEN 1 AND 4),
  team_name TEXT,
  team_short TEXT,
  country_code TEXT,
  source TEXT NOT NULL DEFAULT 'projection' CHECK (source IN ('fifa','manual','provider','projection')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed')),
  is_locked BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_code, slot_position)
);

GRANT SELECT ON public.wc_group_slots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wc_group_slots TO authenticated;
GRANT ALL ON public.wc_group_slots TO service_role;

ALTER TABLE public.wc_group_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view confirmed slots"
  ON public.wc_group_slots FOR SELECT
  TO anon, authenticated
  USING (status = 'confirmed' OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert slots"
  ON public.wc_group_slots FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update slots"
  ON public.wc_group_slots FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete slots"
  ON public.wc_group_slots FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_wc_group_slots_updated
  BEFORE UPDATE ON public.wc_group_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed 48 slots (12 groups × 4 positions). Host nations prelocked.
INSERT INTO public.wc_group_slots (group_code, slot_position, team_name, country_code, source, status, is_locked)
VALUES
  ('A',1,'Mexico','MEX','fifa','confirmed',true),
  ('A',2,NULL,NULL,'projection','draft',false),
  ('A',3,NULL,NULL,'projection','draft',false),
  ('A',4,NULL,NULL,'projection','draft',false),
  ('B',1,'Canada','CAN','fifa','confirmed',true),
  ('B',2,NULL,NULL,'projection','draft',false),
  ('B',3,NULL,NULL,'projection','draft',false),
  ('B',4,NULL,NULL,'projection','draft',false),
  ('C',1,NULL,NULL,'projection','draft',false),
  ('C',2,NULL,NULL,'projection','draft',false),
  ('C',3,NULL,NULL,'projection','draft',false),
  ('C',4,NULL,NULL,'projection','draft',false),
  ('D',1,'United States','USA','fifa','confirmed',true),
  ('D',2,NULL,NULL,'projection','draft',false),
  ('D',3,NULL,NULL,'projection','draft',false),
  ('D',4,NULL,NULL,'projection','draft',false),
  ('E',1,NULL,NULL,'projection','draft',false),('E',2,NULL,NULL,'projection','draft',false),('E',3,NULL,NULL,'projection','draft',false),('E',4,NULL,NULL,'projection','draft',false),
  ('F',1,NULL,NULL,'projection','draft',false),('F',2,NULL,NULL,'projection','draft',false),('F',3,NULL,NULL,'projection','draft',false),('F',4,NULL,NULL,'projection','draft',false),
  ('G',1,NULL,NULL,'projection','draft',false),('G',2,NULL,NULL,'projection','draft',false),('G',3,NULL,NULL,'projection','draft',false),('G',4,NULL,NULL,'projection','draft',false),
  ('H',1,NULL,NULL,'projection','draft',false),('H',2,NULL,NULL,'projection','draft',false),('H',3,NULL,NULL,'projection','draft',false),('H',4,NULL,NULL,'projection','draft',false),
  ('I',1,NULL,NULL,'projection','draft',false),('I',2,NULL,NULL,'projection','draft',false),('I',3,NULL,NULL,'projection','draft',false),('I',4,NULL,NULL,'projection','draft',false),
  ('J',1,NULL,NULL,'projection','draft',false),('J',2,NULL,NULL,'projection','draft',false),('J',3,NULL,NULL,'projection','draft',false),('J',4,NULL,NULL,'projection','draft',false),
  ('K',1,NULL,NULL,'projection','draft',false),('K',2,NULL,NULL,'projection','draft',false),('K',3,NULL,NULL,'projection','draft',false),('K',4,NULL,NULL,'projection','draft',false),
  ('L',1,NULL,NULL,'projection','draft',false),('L',2,NULL,NULL,'projection','draft',false),('L',3,NULL,NULL,'projection','draft',false),('L',4,NULL,NULL,'projection','draft',false)
ON CONFLICT (group_code, slot_position) DO NOTHING;
