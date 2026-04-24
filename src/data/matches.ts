export type TicketStatus = "not_released" | "on_sale" | "sold_out";

export interface TicketSource {
  name: string;
  type: "official" | "resale" | "partner";
  url: string;
  recommended?: boolean;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeShort: string;
  awayShort: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  competition: string;
  country: string;
  date: string;
  stadium: string;
  city: string;
  startingPrice: number | null;
  ticketStatus: TicketStatus;
  ticketReleaseDate: string;
  ticketSources: TicketSource[];
  featured: boolean;
  priority?: boolean;
}

export const matches: Match[] = [
  // Champions League
  {
    id: "1",
    homeTeam: "FC Barcelona",
    awayTeam: "Real Madrid",
    homeShort: "BAR",
    awayShort: "RMA",
    competition: "La Liga",
    country: "Spain",
    date: "2026-05-02T21:00:00",
    stadium: "Spotify Camp Nou",
    city: "Barcelona",
    startingPrice: 89,
    ticketStatus: "on_sale",
    ticketReleaseDate: "2026-04-01T10:00:00",
    ticketSources: [
      { name: "FC Barcelona Tickets", type: "official", url: "https://www.fcbarcelona.com/en/tickets", recommended: true },
      { name: "StubHub", type: "resale", url: "https://www.stubhub.com" },
      { name: "Viagogo", type: "resale", url: "https://www.viagogo.com" },
    ],
    featured: true,
    priority: true,
  },
  {
    id: "2",
    homeTeam: "Manchester City",
    awayTeam: "Arsenal",
    homeShort: "MCI",
    awayShort: "ARS",
    competition: "Premier League",
    country: "England",
    date: "2026-04-25T17:30:00",
    stadium: "Etihad Stadium",
    city: "Manchester",
    startingPrice: 65,
    ticketStatus: "on_sale",
    ticketReleaseDate: "2026-03-20T09:00:00",
    ticketSources: [
      { name: "Man City Tickets", type: "official", url: "https://www.mancity.com/tickets", recommended: true },
      { name: "StubHub", type: "resale", url: "https://www.stubhub.com" },
    ],
    featured: true,
  },
  {
    id: "3",
    homeTeam: "Bayern Munich",
    awayTeam: "Borussia Dortmund",
    homeShort: "BAY",
    awayShort: "BVB",
    competition: "Bundesliga",
    country: "Germany",
    date: "2026-04-26T18:30:00",
    stadium: "Allianz Arena",
    city: "Munich",
    startingPrice: 55,
    ticketStatus: "on_sale",
    ticketReleaseDate: "2026-03-25T10:00:00",
    ticketSources: [
      { name: "FC Bayern Tickets", type: "official", url: "https://www.fcbayern.com/en/tickets", recommended: true },
      { name: "StubHub", type: "resale", url: "https://www.stubhub.com" },
    ],
    featured: true,
    priority: true,
  },
  {
    id: "4",
    homeTeam: "AC Milan",
    awayTeam: "Inter Milan",
    homeShort: "ACM",
    awayShort: "INT",
    competition: "Serie A",
    country: "Italy",
    date: "2026-05-10T20:45:00",
    stadium: "San Siro",
    city: "Milan",
    startingPrice: 75,
    ticketStatus: "not_released",
    ticketReleaseDate: "2026-04-20T10:00:00",
    ticketSources: [
      { name: "AC Milan Official", type: "official", url: "https://www.acmilan.com/en/tickets", recommended: true },
      { name: "StubHub", type: "resale", url: "https://www.stubhub.com" },
    ],
    featured: false,
  },
  {
    id: "5",
    homeTeam: "PSG",
    awayTeam: "Olympique Marseille",
    homeShort: "PSG",
    awayShort: "OM",
    competition: "Ligue 1",
    country: "France",
    date: "2026-05-17T21:00:00",
    stadium: "Parc des Princes",
    city: "Paris",
    startingPrice: null,
    ticketStatus: "not_released",
    ticketReleaseDate: "2026-05-01T10:00:00",
    ticketSources: [
      { name: "PSG Billetterie", type: "official", url: "https://www.psg.fr/tickets", recommended: true },
      { name: "StubHub", type: "resale", url: "https://www.stubhub.com" },
    ],
    featured: false,
  },
  {
    id: "6",
    homeTeam: "Liverpool",
    awayTeam: "Manchester United",
    homeShort: "LIV",
    awayShort: "MUN",
    competition: "Premier League",
    country: "England",
    date: "2026-04-19T16:00:00",
    stadium: "Anfield",
    city: "Liverpool",
    startingPrice: 72,
    ticketStatus: "sold_out",
    ticketReleaseDate: "2026-03-10T09:00:00",
    ticketSources: [
      { name: "Liverpool FC Tickets", type: "official", url: "https://www.liverpoolfc.com/tickets", recommended: true },
      { name: "StubHub", type: "resale", url: "https://www.stubhub.com" },
      { name: "Viagogo", type: "resale", url: "https://www.viagogo.com" },
    ],
    featured: true,
    priority: true,
  },
  {
    id: "7",
    homeTeam: "Juventus",
    awayTeam: "AS Roma",
    homeShort: "JUV",
    awayShort: "ROM",
    competition: "Serie A",
    country: "Italy",
    date: "2026-05-03T20:45:00",
    stadium: "Allianz Stadium",
    city: "Turin",
    startingPrice: 48,
    ticketStatus: "on_sale",
    ticketReleaseDate: "2026-04-05T10:00:00",
    ticketSources: [
      { name: "Juventus Tickets", type: "official", url: "https://www.juventus.com/en/tickets", recommended: true },
      { name: "StubHub", type: "resale", url: "https://www.stubhub.com" },
    ],
    featured: false,
  },
  {
    id: "8",
    homeTeam: "Atletico Madrid",
    awayTeam: "Sevilla",
    homeShort: "ATM",
    awayShort: "SEV",
    competition: "La Liga",
    country: "Spain",
    date: "2026-04-20T19:00:00",
    stadium: "Metropolitano",
    city: "Madrid",
    startingPrice: 40,
    ticketStatus: "on_sale",
    ticketReleaseDate: "2026-03-28T10:00:00",
    ticketSources: [
      { name: "Atletico Official", type: "official", url: "https://www.atleticodemadrid.com/tickets", recommended: true },
      { name: "StubHub", type: "resale", url: "https://www.stubhub.com" },
    ],
    featured: false,
  },
  {
    id: "9",
    homeTeam: "Chelsea",
    awayTeam: "Tottenham",
    homeShort: "CHE",
    awayShort: "TOT",
    competition: "Premier League",
    country: "England",
    date: "2026-05-09T15:00:00",
    stadium: "Stamford Bridge",
    city: "London",
    startingPrice: 68,
    ticketStatus: "not_released",
    ticketReleaseDate: "2026-04-18T09:00:00",
    ticketSources: [
      { name: "Chelsea FC Tickets", type: "official", url: "https://www.chelseafc.com/en/tickets", recommended: true },
      { name: "StubHub", type: "resale", url: "https://www.stubhub.com" },
    ],
    featured: false,
  },
  {
    id: "10",
    homeTeam: "Real Madrid",
    awayTeam: "Villarreal",
    homeShort: "RMA",
    awayShort: "VIL",
    competition: "La Liga",
    country: "Spain",
    date: "2026-04-22T21:00:00",
    stadium: "Santiago Bernabéu",
    city: "Madrid",
    startingPrice: 60,
    ticketStatus: "on_sale",
    ticketReleaseDate: "2026-03-30T10:00:00",
    ticketSources: [
      { name: "Real Madrid Tickets", type: "official", url: "https://www.realmadrid.com/en/tickets", recommended: true },
      { name: "StubHub", type: "resale", url: "https://www.stubhub.com" },
    ],
    featured: false,
  },
  // Champions League matches
  {
    id: "11",
    homeTeam: "Real Madrid",
    awayTeam: "Bayern Munich",
    homeShort: "RMA",
    awayShort: "BAY",
    competition: "Champions League",
    country: "Europe",
    date: "2026-04-29T21:00:00",
    stadium: "Santiago Bernabéu",
    city: "Madrid",
    startingPrice: 120,
    ticketStatus: "on_sale",
    ticketReleaseDate: "2026-04-10T10:00:00",
    ticketSources: [
      { name: "UEFA Tickets", type: "official", url: "https://www.uefa.com/tickets", recommended: true },
      { name: "StubHub", type: "resale", url: "https://www.stubhub.com" },
    ],
    featured: true,
    priority: true,
  },
  {
    id: "12",
    homeTeam: "Arsenal",
    awayTeam: "PSG",
    homeShort: "ARS",
    awayShort: "PSG",
    competition: "Champions League",
    country: "Europe",
    date: "2026-04-30T21:00:00",
    stadium: "Emirates Stadium",
    city: "London",
    startingPrice: 95,
    ticketStatus: "not_released",
    ticketReleaseDate: "2026-04-15T10:00:00",
    ticketSources: [
      { name: "UEFA Tickets", type: "official", url: "https://www.uefa.com/tickets", recommended: true },
      { name: "StubHub", type: "resale", url: "https://www.stubhub.com" },
    ],
    featured: true,
  },
  // International
  {
    id: "13",
    homeTeam: "France",
    awayTeam: "Germany",
    homeShort: "FRA",
    awayShort: "GER",
    competition: "International Friendly",
    country: "International",
    date: "2026-06-05T21:00:00",
    stadium: "Stade de France",
    city: "Paris",
    startingPrice: 45,
    ticketStatus: "not_released",
    ticketReleaseDate: "2026-05-10T10:00:00",
    ticketSources: [
      { name: "FFF Billetterie", type: "official", url: "https://www.fff.fr/billetterie", recommended: true },
      { name: "StubHub", type: "resale", url: "https://www.stubhub.com" },
    ],
    featured: false,
  },
  {
    id: "14",
    homeTeam: "England",
    awayTeam: "Spain",
    homeShort: "ENG",
    awayShort: "ESP",
    competition: "International Friendly",
    country: "International",
    date: "2026-06-10T20:00:00",
    stadium: "Wembley Stadium",
    city: "London",
    startingPrice: 50,
    ticketStatus: "not_released",
    ticketReleaseDate: "2026-05-15T09:00:00",
    ticketSources: [
      { name: "FA Tickets", type: "official", url: "https://www.thefa.com/tickets", recommended: true },
      { name: "StubHub", type: "resale", url: "https://www.stubhub.com" },
    ],
    featured: false,
  },
  // More league matches
  {
    id: "15",
    homeTeam: "Napoli",
    awayTeam: "Lazio",
    homeShort: "NAP",
    awayShort: "LAZ",
    competition: "Serie A",
    country: "Italy",
    date: "2026-05-04T18:00:00",
    stadium: "Stadio Diego Armando Maradona",
    city: "Naples",
    startingPrice: 35,
    ticketStatus: "on_sale",
    ticketReleaseDate: "2026-04-08T10:00:00",
    ticketSources: [
      { name: "SSC Napoli Tickets", type: "official", url: "https://www.sscnapoli.it/tickets", recommended: true },
      { name: "StubHub", type: "resale", url: "https://www.stubhub.com" },
    ],
    featured: false,
  },
];

export const competitions = [...new Set(matches.map((m) => m.competition))];
export const countries = [...new Set(matches.map((m) => m.country))];
