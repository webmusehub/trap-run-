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
        highest_level_reached,
        completed_levels,
        status,
        time_ms,
        deaths,
        coins,
        created_at,
        players!inner(display_name)
      `)
      .in("status", ["COMPLETED", "VICTORY", "DEAD"])
      .order("highest_level_reached", { ascending: false })
      .order("time_ms", { ascending: true })
      .order("deaths", { ascending: true })
      .order("coins", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(100);

    if (level > 0 && level <= 10) {
      query = query.gte("highest_level_reached", level);
    }

    const { data, error } = await query;
    if (error) throw error;

    const topScores = (data || []).map((row: any, idx: number) => ({
      rank: idx + 1,
      playerId: row.player_id,
      displayName: row.players?.display_name || "Runner",
      level: row.level,
      highestLevelReached: row.highest_level_reached ?? row.level ?? 1,
      completedLevels: row.completed_levels ?? (row.status === "COMPLETED" || row.status === "VICTORY" ? row.level : Math.max(0, row.level - 1)),
      status: row.status,
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
          highest_level_reached,
          completed_levels,
          status,
          time_ms,
          deaths,
          coins,
          created_at,
          players!inner(display_name)
        `)
        .eq("player_id", playerId)
        .in("status", ["COMPLETED", "VICTORY", "DEAD"])
        .order("highest_level_reached", { ascending: false })
        .order("time_ms", { ascending: true })
        .limit(1);

      if (level > 0 && level <= 10) {
        pQuery = pQuery.gte("highest_level_reached", level);
      }

      const { data: pData } = await pQuery;
      if (pData && pData.length > 0) {
        const bestRun = pData[0];
        playerRank = {
          rank: 99, // Fallback personal rank indicator
          playerId: bestRun.player_id,
          displayName: bestRun.players?.display_name || "Runner",
          level: bestRun.level,
          highestLevelReached: bestRun.highest_level_reached ?? bestRun.level ?? 1,
          completedLevels: bestRun.completed_levels ?? (bestRun.status === "COMPLETED" || bestRun.status === "VICTORY" ? bestRun.level : Math.max(0, bestRun.level - 1)),
          status: bestRun.status,
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
