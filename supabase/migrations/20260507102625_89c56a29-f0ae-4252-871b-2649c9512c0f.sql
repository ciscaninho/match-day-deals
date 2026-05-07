
CREATE TABLE public.stadiums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  city text NOT NULL,
  country text NOT NULL DEFAULT 'Italy',
  league text NOT NULL DEFAULT 'Serie A',
  capacity integer,
  opened_year integer,
  club_name text,
  clubs text[] NOT NULL DEFAULT '{}',
  atmosphere_score numeric(3,1),
  family_friendly_score numeric(3,1),
  accessibility_score numeric(3,1),
  popularity_score numeric(3,1),
  value_score numeric(3,1),
  latitude numeric(9,6),
  longitude numeric(9,6),
  image_url text,
  background_image_url text,
  description text,
  best_sections text[] DEFAULT '{}',
  ultras_section text,
  family_section text,
  vip_available boolean NOT NULL DEFAULT false,
  official_ticket_provider text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stadiums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stadiums" ON public.stadiums FOR SELECT USING (true);
CREATE POLICY "Admins can insert stadiums" ON public.stadiums FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update stadiums" ON public.stadiums FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete stadiums" ON public.stadiums FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_stadiums_updated_at
BEFORE UPDATE ON public.stadiums
FOR EACH ROW EXECUTE FUNCTION public.update_matches_updated_at();

CREATE INDEX idx_stadiums_slug ON public.stadiums(slug);
CREATE INDEX idx_stadiums_league ON public.stadiums(league);
CREATE INDEX idx_stadiums_city ON public.stadiums(city);

INSERT INTO public.stadiums (stadium_name, slug, city, country, league, capacity, opened_year, club_name, clubs, atmosphere_score, family_friendly_score, accessibility_score, popularity_score, value_score, latitude, longitude, description, best_sections, ultras_section, family_section, vip_available, official_ticket_provider) VALUES
('Allianz Stadium', 'allianz-stadium', 'Turin', 'Italy', 'Serie A', 41507, 2011, 'Juventus', ARRAY['Juventus'], 9.2, 8.5, 9.0, 9.5, 7.5, 45.109444, 7.641111, 'Modern home of Juventus, one of Italy''s most atmospheric stadiums with steep stands close to the pitch.', ARRAY['Curva Sud','Tribuna Est'], 'Curva Sud', 'Tribuna Famiglia', true, 'Juventus Official'),
('San Siro', 'san-siro', 'Milan', 'Italy', 'Serie A', 75923, 1926, 'AC Milan / Inter', ARRAY['AC Milan','Inter Milan'], 9.7, 8.0, 7.5, 9.8, 7.8, 45.478056, 9.124167, 'Iconic Giuseppe Meazza stadium, shared by Milan giants. Legendary atmosphere on European nights.', ARRAY['Curva Sud (Milan)','Curva Nord (Inter)'], 'Curva Sud / Curva Nord', 'Tribuna Arancio', true, 'Vivaticket'),
('Stadio Olimpico', 'stadio-olimpico', 'Rome', 'Italy', 'Serie A', 70634, 1953, 'AS Roma / Lazio', ARRAY['AS Roma','Lazio'], 9.4, 8.0, 8.5, 9.3, 7.7, 41.933889, 12.454722, 'Historic Roman stadium home to Roma and Lazio, famous for the Derby della Capitale.', ARRAY['Curva Sud (Roma)','Curva Nord (Lazio)'], 'Curva Sud / Curva Nord', 'Tribuna Tevere Family', true, 'Vivaticket'),
('Stadio Diego Armando Maradona', 'stadio-maradona', 'Naples', 'Italy', 'Serie A', 54726, 1959, 'Napoli', ARRAY['Napoli'], 9.6, 7.5, 7.8, 9.4, 7.6, 40.827778, 14.193056, 'Renamed in honor of Diego Maradona. Electric atmosphere driven by passionate Neapolitan fans.', ARRAY['Curva A','Curva B'], 'Curva B', 'Distinti Famiglia', true, 'TicketOne'),
('Stadio Artemio Franchi', 'stadio-franchi', 'Florence', 'Italy', 'Serie A', 43147, 1931, 'Fiorentina', ARRAY['Fiorentina'], 8.5, 7.8, 7.0, 8.2, 7.9, 43.780833, 11.282222, 'Historic Florentine stadium with iconic Maratona tower designed by Pier Luigi Nervi.', ARRAY['Curva Fiesole'], 'Curva Fiesole', 'Tribuna Family', true, 'Vivaticket'),
('Stadio Renato Dall''Ara', 'stadio-dallara', 'Bologna', 'Italy', 'Serie A', 38279, 1927, 'Bologna', ARRAY['Bologna'], 8.3, 8.2, 7.5, 7.8, 8.2, 44.492222, 11.309722, 'Charming historic stadium known for its tower and intimate atmosphere.', ARRAY['Curva Andrea Costa'], 'Curva Andrea Costa', 'Tribuna Family', true, 'Vivaticket'),
('Gewiss Stadium', 'gewiss-stadium', 'Bergamo', 'Italy', 'Serie A', 24950, 1928, 'Atalanta', ARRAY['Atalanta'], 9.1, 7.8, 8.0, 8.5, 8.0, 45.708889, 9.680833, 'Compact, modernized stadium delivering one of Serie A''s most intense atmospheres.', ARRAY['Curva Nord Pisani'], 'Curva Nord', 'Tribuna Family', true, 'Vivaticket'),
('Stadio Olimpico Grande Torino', 'stadio-grande-torino', 'Turin', 'Italy', 'Serie A', 27958, 1933, 'Torino', ARRAY['Torino'], 8.4, 7.8, 8.0, 7.5, 8.2, 45.041667, 7.65, 'Home of Torino FC, named in tribute to the Grande Torino team.', ARRAY['Curva Maratona'], 'Curva Maratona', 'Tribuna Family', true, 'Vivaticket'),
('Stadio Luigi Ferraris', 'stadio-luigi-ferraris', 'Genoa', 'Italy', 'Serie A', 36703, 1911, 'Genoa / Sampdoria', ARRAY['Genoa','Sampdoria'], 9.0, 7.5, 7.0, 8.4, 8.0, 44.416389, 8.952222, 'One of Italy''s oldest stadiums (Marassi), shared by Genoa and Sampdoria.', ARRAY['Gradinata Nord','Gradinata Sud'], 'Gradinata Nord / Sud', 'Tribuna Family', true, 'Vivaticket'),
('Bluenergy Stadium', 'bluenergy-stadium', 'Udine', 'Italy', 'Serie A', 25144, 1976, 'Udinese', ARRAY['Udinese'], 8.0, 8.5, 9.2, 7.5, 8.5, 46.081667, 13.200278, 'Modern, fully renovated stadium (formerly Dacia Arena) with excellent visibility.', ARRAY['Curva Nord'], 'Curva Nord', 'Tribuna Family', true, 'Vivaticket'),
('Stadio Via del Mare', 'stadio-via-del-mare', 'Lecce', 'Italy', 'Serie A', 31533, 1966, 'Lecce', ARRAY['Lecce'], 8.6, 7.8, 7.5, 7.5, 8.4, 40.365556, 18.208889, 'Vibrant southern Italian stadium with passionate Salento support.', ARRAY['Curva Nord'], 'Curva Nord', 'Tribuna Family', true, 'Vivaticket'),
('Unipol Domus', 'unipol-domus', 'Cagliari', 'Italy', 'Serie A', 16416, 2017, 'Cagliari', ARRAY['Cagliari'], 8.2, 7.8, 8.0, 7.2, 8.3, 39.199722, 9.137222, 'Temporary modern arena with intimate atmosphere on Sardinia''s coast.', ARRAY['Curva Nord'], 'Curva Nord', 'Tribuna Family', true, 'Vivaticket'),
('Stadio Marcantonio Bentegodi', 'stadio-bentegodi', 'Verona', 'Italy', 'Serie A', 39211, 1963, 'Hellas Verona', ARRAY['Hellas Verona'], 8.4, 7.5, 7.5, 7.6, 8.1, 45.435, 10.968611, 'Home of Hellas Verona, known for the fervent Curva Sud.', ARRAY['Curva Sud'], 'Curva Sud', 'Tribuna Family', true, 'Vivaticket'),
('Stadio Ennio Tardini', 'stadio-tardini', 'Parma', 'Italy', 'Serie A', 22885, 1923, 'Parma', ARRAY['Parma'], 8.0, 8.0, 7.5, 7.4, 8.2, 44.794722, 10.338056, 'Historic stadium of Parma Calcio with classic Italian football charm.', ARRAY['Curva Nord'], 'Curva Nord', 'Tribuna Family', true, 'Vivaticket'),
('Stadio Giuseppe Sinigaglia', 'stadio-sinigaglia', 'Como', 'Italy', 'Serie A', 13602, 1927, 'Como', ARRAY['Como'], 7.8, 8.5, 7.0, 7.0, 8.6, 45.815, 9.071944, 'Picturesque stadium on the shores of Lake Como.', ARRAY['Curva'], 'Curva', 'Tribuna Family', false, 'Vivaticket'),
('U-Power Stadium', 'u-power-stadium', 'Monza', 'Italy', 'Serie A', 16917, 1988, 'Monza', ARRAY['Monza'], 7.8, 8.4, 8.5, 7.2, 8.4, 45.582778, 9.308611, 'Renovated stadium in Brianza, comfortable modern viewing experience.', ARRAY['Curva Davide Pieri'], 'Curva Davide Pieri', 'Tribuna Family', true, 'Vivaticket'),
('Stadio Pier Luigi Penzo', 'stadio-penzo', 'Venice', 'Italy', 'Serie A', 11150, 1913, 'Venezia', ARRAY['Venezia'], 8.1, 8.0, 6.5, 7.5, 8.3, 45.428889, 12.363611, 'Unique stadium reachable by boat in the Venice lagoon.', ARRAY['Curva Sud'], 'Curva Sud', 'Tribuna Family', false, 'Vivaticket');
