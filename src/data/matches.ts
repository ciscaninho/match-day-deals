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

// Mock data removed — all match data is now fetched from Supabase via `useMatches`.
// These empty exports remain only so legacy imports don't break the build.
export const matches: Match[] = [];
export const competitions: string[] = [];
export const countries: string[] = [];
