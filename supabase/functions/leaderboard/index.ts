// ─────────────────────────────────────────────────────────────────────────────
// Supabase Edge Function: leaderboard
// Returns Top 100 completed runs and requesting player's personal rank.
// Supports filtering by level (0 = overall/global, 1-10 = specific level).
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const levelStr = url.searchParams.get("level") || "0";
    const playerId = url.searchParams.get("playerId") || "";
    const level = parseInt(levelStr, 10);

    let query = supabase
      .from("runs")
      .select(`
        id,
        player_id,
        level,
        time_ms,
        deaths,
        coins,
        created_at,
        players!inner(display_name)
      `)
      .eq("status", "COMPLETED")
      .order("time_ms", { ascending: true })
      .order("deaths", { ascending: true })
      .limit(100);

    if (level > 0 && level <= 10) {
      query = query.eq("level", level);
    }

    const { data, error } = await query;
    if (error) throw error;

    const topScores = (data || []).map((row: any, idx: number) => ({
      rank: idx + 1,
      playerId: row.player_id,
      displayName: row.players?.display_name || "Anonymous",
      level: row.level,
      timeMs: row.time_ms,
      deaths: row.deaths,
      coins: row.coins,
      createdAt: row.created_at,
    }));

    // Find personal rank for current player if not in top 100
    let playerRank = topScores.find((entry: any) => entry.playerId === playerId) || null;

    if (!playerRank && playerId) {
      let pQuery = supabase
        .from("runs")
        .select(`
          id,
          player_id,
          level,
          time_ms,
          deaths,
          coins,
          created_at,
          players!inner(display_name)
        `)
        .eq("player_id", playerId)
        .eq("status", "COMPLETED")
        .order("time_ms", { ascending: true })
        .limit(1);

      if (level > 0 && level <= 10) {
        pQuery = pQuery.eq("level", level);
      }

      const { data: pData } = await pQuery;
      if (pData && pData.length > 0) {
        const bestRun = pData[0];
        // Calculate rank by counting lower time_ms
        let countQuery = supabase
          .from("runs")
          .select("id", { count: "exact", head: true })
          .eq("status", "COMPLETED")
          .lt("time_ms", bestRun.time_ms);

        if (level > 0 && level <= 10) {
          countQuery = countQuery.eq("level", level);
        }

        const { count } = await countQuery;
        playerRank = {
          rank: (count ?? 0) + 1,
          playerId: bestRun.player_id,
          displayName: bestRun.players?.display_name || "Anonymous",
          level: bestRun.level,
          timeMs: bestRun.time_ms,
          deaths: bestRun.deaths,
          coins: bestRun.coins,
          createdAt: bestRun.created_at,
        };
      }
    }

    return new Response(
      JSON.stringify({ topScores, playerRank }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
