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
    time_ms INT NOT NULL CHECK (time_ms > 0),
    deaths INT NOT NULL DEFAULT 0 CHECK (deaths >= 0),
    coins INT NOT NULL DEFAULT 0 CHECK (coins >= 0),
    status TEXT NOT NULL DEFAULT 'STARTED' CHECK (status IN ('STARTED', 'COMPLETED', 'INVALID', 'EXPIRED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes supporting fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_runs_leaderboard ON public.runs(level, time_ms ASC, deaths ASC) WHERE status = 'COMPLETED';
CREATE INDEX IF NOT EXISTS idx_runs_player_id ON public.runs(player_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON public.runs(status);

-- -----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to leaderboards (anon key can SELECT)
CREATE POLICY "Public players are viewable by everyone." 
    ON public.players FOR SELECT 
    USING (true);

CREATE POLICY "Public completed runs are viewable by everyone." 
    ON public.runs FOR SELECT 
    USING (status = 'COMPLETED');

-- Restrict direct client INSERT/UPDATE/DELETE operations.
-- All write operations MUST be executed via Edge Functions with service-role key or RPC!
-- This enforces server-side score validation and prevents cheat injections from browser console.
