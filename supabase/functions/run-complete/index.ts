// ─────────────────────────────────────────────────────────────────────────────
// Supabase Edge Function: run-complete
// Validates completion payload against level limits, run lifecycle, and physics.
// Prevents duplicate submissions, replay attacks, and absurd completion scores.
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LEVEL_LIMITS: Record<number, { maxCoins: number; minTimeMs: number }> = {
  1:  { maxCoins: 5,  minTimeMs: 3500 },
  2:  { maxCoins: 7,  minTimeMs: 4500 },
  3:  { maxCoins: 8,  minTimeMs: 5000 },
  4:  { maxCoins: 8,  minTimeMs: 5500 },
  5:  { maxCoins: 10, minTimeMs: 6000 },
  6:  { maxCoins: 10, minTimeMs: 6500 },
  7:  { maxCoins: 10, minTimeMs: 7000 },
  8:  { maxCoins: 12, minTimeMs: 7500 },
  9:  { maxCoins: 15, minTimeMs: 9000 },
  10: { maxCoins: 15, minTimeMs: 11000 },
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
    const { runId, playerId, displayName, level, timeMs, deaths, coins } = body;

    const levelId = parseInt(level, 10);
    const timeVal = parseInt(timeMs, 10);
    const deathVal = parseInt(deaths, 10);
    const coinVal = parseInt(coins, 10);

    // 1. Parameter Validation
    if (!runId || !playerId || !levelId || !LEVEL_LIMITS[levelId]) {
      return new Response(JSON.stringify({ success: false, reason: "Invalid level or missing parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const limits = LEVEL_LIMITS[levelId];

    // Anti-cheat limit checks
    if (isNaN(timeVal) || timeVal < limits.minTimeMs) {
      return new Response(JSON.stringify({ success: false, reason: `Physically impossible completion time for Level ${levelId}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isNaN(coinVal) || coinVal < 0 || coinVal > limits.maxCoins) {
      return new Response(JSON.stringify({ success: false, reason: `Coin count exceeds max ${limits.maxCoins} for Level ${levelId}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isNaN(deathVal) || deathVal < 0) {
      return new Response(JSON.stringify({ success: false, reason: "Invalid death count" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Run Record Existence & State Verification
    const { data: run, error: fetchError } = await supabase
      .from("runs")
      .select("*")
      .eq("id", runId)
      .single();

    if (fetchError || !run) {
      return new Response(JSON.stringify({ success: false, reason: "Run ID not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (run.player_id !== playerId) {
      return new Response(JSON.stringify({ success: false, reason: "Run player mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (run.status !== "STARTED") {
      return new Response(JSON.stringify({ success: false, reason: `Run already processed (${run.status})` }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Mark Run as COMPLETED
    const { error: updateError } = await supabase
      .from("runs")
      .update({
        time_ms: timeVal,
        deaths: deathVal,
        coins: coinVal,
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);

    if (updateError) throw updateError;

    // 4. Calculate Rank for this level
    const { count: higherCount } = await supabase
      .from("runs")
      .select("id", { count: "exact", head: true })
      .eq("level", levelId)
      .eq("status", "COMPLETED")
      .lt("time_ms", timeVal);

    const rank = (higherCount ?? 0) + 1;

    return new Response(
      JSON.stringify({ success: true, rank, isPersonalBest: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, reason: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
