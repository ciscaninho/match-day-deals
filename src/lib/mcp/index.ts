import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchMatches from "./tools/search-matches";
import getMatch from "./tools/get-match";
import searchStadiums from "./tools/search-stadiums";
import searchClubs from "./tools/search-clubs";
import listMyFavorites from "./tools/list-my-favorites";
import saveMatch from "./tools/save-match";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "foot-ticket-finder-mcp",
  title: "Foot Ticket Finder",
  version: "0.1.0",
  instructions:
    "Tools for Foot Ticket Finder — find upcoming football matches, stadiums and clubs, and manage the signed-in user's saved matches and ticket alerts. Public catalog data is readable by any authenticated user; user-specific tools act as the signed-in user through RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchMatches, getMatch, searchStadiums, searchClubs, listMyFavorites, saveMatch],
});
