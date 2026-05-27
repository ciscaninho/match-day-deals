import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    const loadMatches = async () => {
      // World Cup 2026 fixtures are excluded from the generic matches list —
      // they live exclusively in /world-cup-2026 and /admin/world-cup-2026.
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .neq("competition", "FIFA World Cup 2026");

      if (error) {
        console.error("Erreur:", error);
      } else {
        setMatches(data || []);
      }
    };

    loadMatches();
  }, []);


  return (
    <div style={{ padding: 20 }}>
      <h1>Matches</h1>

      {matches.length === 0 && <p>Aucun match trouvé</p>}

      {matches.map((m) => (
        <div key={m.id}>
          {m.home_team} vs {m.away_team}
        </div>
      ))}
    </div>
  );
}
