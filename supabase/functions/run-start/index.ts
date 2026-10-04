// ─────────────────────────────────────────────────────────────────────────────
// Supabase Edge Function: run-start
// Receives { playerId, displayName, level }
// Upserts player profile and starts a new run record with status 'STARTED'
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

    const body = await req.json();
    const { playerId, displayName, level } = body;

    if (!playerId || typeof playerId !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid playerId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanName = (displayName || "Anonymous").trim().slice(0, 16);
    const levelId = parseInt(level, 10) || 1;

    // 1. Upsert player record
    const { error: playerError } = await supabase
      .from("players")
      .upsert({ id: playerId, display_name: cleanName, updated_at: new Date().toISOString() });

    if (playerError) {
      console.error("Player upsert error:", playerError);
    }

    // 2. Insert new run record with status 'STARTED'
    const { data: runData, error: runError } = await supabase
      .from("runs")
      .insert({
        player_id: playerId,
        level: levelId,
        time_ms: 9999999, // default placeholder
        deaths: 0,
        coins: 0,
        status: "STARTED",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (runError) {
      throw runError;
    }

    return new Response(
      JSON.stringify({ runId: runData.id, startedAt: Date.now() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
