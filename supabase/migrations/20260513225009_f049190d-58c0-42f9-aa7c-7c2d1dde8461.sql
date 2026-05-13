
-- Stadium Media Library (Phase 1: data + tab)

CREATE TABLE IF NOT EXISTS public.stadium_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id UUID,
  stadium_slug TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'exterior'
    CHECK (category IN ('hero','exterior','interior','atmosphere','aerial','historical')),
  url TEXT NOT NULL,
  storage_path TEXT,
  source TEXT NOT NULL DEFAULT 'external'
    CHECK (source IN ('upload','external','import')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','archived')),
  is_hero BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  notes TEXT,
  uploaded_by UUID,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stadium_media_slug ON public.stadium_media(stadium_slug);
CREATE INDEX IF NOT EXISTS idx_stadium_media_status ON public.stadium_media(status);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_stadium_media_hero
  ON public.stadium_media(stadium_slug)
  WHERE is_hero = true;

ALTER TABLE public.stadium_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads approved stadium media"
  ON public.stadium_media FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Admins view all stadium media"
  ON public.stadium_media FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert stadium media"
  ON public.stadium_media FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update stadium media"
  ON public.stadium_media FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete stadium media"
  ON public.stadium_media FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Touch updated_at
CREATE OR REPLACE FUNCTION public.touch_stadium_media_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_stadium_media_touch ON public.stadium_media;
CREATE TRIGGER trg_stadium_media_touch
  BEFORE UPDATE ON public.stadium_media
  FOR EACH ROW EXECUTE FUNCTION public.touch_stadium_media_updated_at();

-- Sync stadiums.hero_image_url from media library when an approved hero exists.
CREATE OR REPLACE FUNCTION public.sync_stadium_hero_image()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_slug TEXT;
  v_url TEXT;
BEGIN
  v_slug := COALESCE(NEW.stadium_slug, OLD.stadium_slug);

  -- If marking a row as hero+approved, demote any other hero for this stadium.
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.is_hero = true THEN
    UPDATE public.stadium_media
       SET is_hero = false
     WHERE stadium_slug = NEW.stadium_slug
       AND id <> NEW.id
       AND is_hero = true;
  END IF;

  -- Resolve current hero candidate.
  SELECT url INTO v_url
    FROM public.stadium_media
   WHERE stadium_slug = v_slug
     AND is_hero = true
     AND status = 'approved'
   LIMIT 1;

  UPDATE public.stadiums
     SET hero_image_url = v_url,
         updated_at = now()
   WHERE slug = v_slug
     AND COALESCE(hero_image_url, '') IS DISTINCT FROM COALESCE(v_url, hero_image_url);

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_stadium_media_sync_hero ON public.stadium_media;
CREATE TRIGGER trg_stadium_media_sync_hero
  AFTER INSERT OR UPDATE OF is_hero, status, url OR DELETE ON public.stadium_media
  FOR EACH ROW EXECUTE FUNCTION public.sync_stadium_hero_image();
