import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    const loadMatches = async () => {
      const { data, error } = await supabase.from("matches").select("*");

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
