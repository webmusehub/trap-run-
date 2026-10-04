-- =============================================================================
-- TRAP RUN — SUPABASE PRODUCTION DATABASE SCHEMA
-- Source of truth: Master Release Candidate Prompt §8, §9, §10, §34
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. PLAYERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_name TEXT NOT NULL CHECK (char_length(trim(display_name)) >= 2 AND char_length(trim(display_name)) <= 16),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for searching players by ID
CREATE INDEX IF NOT EXISTS idx_players_id ON public.players(id);

-- -----------------------------------------------------------------------------
-- 2. RUNS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    level INT NOT NULL CHECK (level >= 1 AND level <= 10),
    highest_level_reached INT NOT NULL DEFAULT 1 CHECK (highest_level_reached >= 1 AND highest_level_reached <= 10),
    completed_levels INT NOT NULL DEFAULT 0 CHECK (completed_levels >= 0 AND completed_levels <= 10),
    time_ms INT NOT NULL CHECK (time_ms > 0),
    deaths INT NOT NULL DEFAULT 0 CHECK (deaths >= 0),
    coins INT NOT NULL DEFAULT 0 CHECK (coins >= 0),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('STARTED', 'ACTIVE', 'DEAD', 'COMPLETED', 'VICTORY', 'INVALID', 'EXPIRED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backward compatibility migration for existing columns
ALTER TABLE public.runs ADD COLUMN IF NOT EXISTS highest_level_reached INT DEFAULT 1;
ALTER TABLE public.runs ADD COLUMN IF NOT EXISTS completed_levels INT DEFAULT 0;

-- Update status constraint if table already existed
ALTER TABLE public.runs DROP CONSTRAINT IF EXISTS runs_status_check;
ALTER TABLE public.runs ADD CONSTRAINT runs_status_check CHECK (status IN ('STARTED', 'ACTIVE', 'DEAD', 'COMPLETED', 'VICTORY', 'INVALID', 'EXPIRED'));

-- Backfill existing COMPLETED rows
UPDATE public.runs
SET highest_level_reached = level,
    completed_levels = CASE WHEN status = 'COMPLETED' OR status = 'VICTORY' THEN level ELSE GREATEST(0, level - 1) END
WHERE highest_level_reached IS NULL OR highest_level_reached = 1;

-- Indexes supporting fast global & per-level leaderboard queries
CREATE INDEX IF NOT EXISTS idx_runs_global_leaderboard
ON public.runs(highest_level_reached DESC, time_ms ASC, deaths ASC, coins DESC, created_at ASC)
WHERE status IN ('COMPLETED', 'VICTORY', 'DEAD');

CREATE INDEX IF NOT EXISTS idx_runs_level_leaderboard
ON public.runs(level, highest_level_reached DESC, time_ms ASC, deaths ASC, coins DESC)
WHERE status IN ('COMPLETED', 'VICTORY', 'DEAD');

CREATE INDEX IF NOT EXISTS idx_runs_player_id ON public.runs(player_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON public.runs(status);

-- -----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to leaderboards (anon key can SELECT)
DROP POLICY IF EXISTS "Public players are viewable by everyone." ON public.players;
CREATE POLICY "Public players are viewable by everyone." 
    ON public.players FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Public completed runs are viewable by everyone." ON public.runs;
DROP POLICY IF EXISTS "Public finalized runs are viewable by everyone." ON public.runs;

CREATE POLICY "Public finalized runs are viewable by everyone."
    ON public.runs FOR SELECT
    USING (status IN ('COMPLETED', 'VICTORY', 'DEAD'));

-- Restrict direct client INSERT/UPDATE/DELETE operations.
-- All write operations MUST be executed via Edge Functions with service-role key or RPC!
-- This enforces server-side score validation and prevents cheat injections from browser console.
