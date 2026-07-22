-- =====================================================
-- Guild Bridge Bot — Supabase Database Schema
-- Run this in the Supabase SQL editor to initialize your database
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- guild_members
-- =====================================================
CREATE TABLE IF NOT EXISTS guild_members (
    uuid        TEXT PRIMARY KEY,
    username    TEXT NOT NULL,
    rank        TEXT,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at     TIMESTAMPTZ,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guild_members_active ON guild_members (is_active);
CREATE INDEX IF NOT EXISTS idx_guild_members_username ON guild_members (username);

-- =====================================================
-- chat_messages
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id          BIGSERIAL PRIMARY KEY,
    author_uuid TEXT,
    author_name TEXT NOT NULL,
    channel     TEXT NOT NULL CHECK (channel IN ('guild', 'officer', 'party', 'private')),
    content     TEXT NOT NULL,
    source      TEXT NOT NULL CHECK (source IN ('minecraft', 'discord')),
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_author ON chat_messages (author_uuid);

-- =====================================================
-- analytics_daily
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_daily (
    date                DATE PRIMARY KEY,
    total_messages      INT NOT NULL DEFAULT 0,
    unique_chatters     INT NOT NULL DEFAULT 0,
    joins               INT NOT NULL DEFAULT 0,
    leaves              INT NOT NULL DEFAULT 0,
    kicks               INT NOT NULL DEFAULT 0,
    promotions          INT NOT NULL DEFAULT 0,
    demotions           INT NOT NULL DEFAULT 0,
    quest_completions   INT NOT NULL DEFAULT 0,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- analytics_chatters
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_chatters (
    date            DATE NOT NULL,
    uuid            TEXT NOT NULL,
    username        TEXT NOT NULL,
    message_count   INT NOT NULL DEFAULT 0,
    PRIMARY KEY (date, uuid)
);

CREATE INDEX IF NOT EXISTS idx_analytics_chatters_date ON analytics_chatters (date DESC);

-- =====================================================
-- sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uuid       TEXT NOT NULL,
    username        TEXT NOT NULL,
    game_mode       TEXT NOT NULL,
    start_stats     JSONB,
    end_stats       JSONB,
    gained_stats    JSONB,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_uuid, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions (status);

-- =====================================================
-- bans
-- =====================================================
CREATE TABLE IF NOT EXISTS bans (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid        TEXT NOT NULL,
    username    TEXT NOT NULL,
    ban_type    TEXT NOT NULL CHECK (ban_type IN ('guild', 'bridge', 'command')),
    reason      TEXT NOT NULL,
    banned_by   TEXT NOT NULL,
    banned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    discord_message_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_bans_uuid ON bans (uuid, is_active);
CREATE INDEX IF NOT EXISTS idx_bans_username ON bans (username, is_active);

-- =====================================================
-- blacklist
-- =====================================================
CREATE TABLE IF NOT EXISTS blacklist (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid        TEXT NOT NULL UNIQUE,
    username    TEXT NOT NULL,
    reason      TEXT NOT NULL,
    added_by    TEXT NOT NULL,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    discord_message_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_blacklist_uuid ON blacklist (uuid, is_active);

-- =====================================================
-- audit_log
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    actor       TEXT NOT NULL,
    action      TEXT NOT NULL,
    target      TEXT,
    details     JSONB,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log (actor);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log (action);

-- =====================================================
-- webhooks
-- =====================================================
CREATE TABLE IF NOT EXISTS webhooks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    url         TEXT NOT NULL,
    events      TEXT[] NOT NULL DEFAULT '{}',
    secret      TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- bot_health (periodic snapshots)
-- =====================================================
CREATE TABLE IF NOT EXISTS bot_health (
    id                      BIGSERIAL PRIMARY KEY,
    timestamp               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status                  TEXT NOT NULL,
    uptime_seconds          INT NOT NULL DEFAULT 0,
    memory_mb               FLOAT,
    connected_to_hypixel    BOOLEAN NOT NULL DEFAULT FALSE,
    discord_connected       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_bot_health_timestamp ON bot_health (timestamp DESC);

-- =====================================================
-- mutes
-- =====================================================
CREATE TABLE IF NOT EXISTS mutes (
    id          TEXT PRIMARY KEY,
    uuid        TEXT NOT NULL,
    username    TEXT NOT NULL,
    discord_id  TEXT,
    reason      TEXT NOT NULL,
    muted_by    TEXT NOT NULL,
    muted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_mutes_uuid ON mutes (uuid, is_active);
CREATE INDEX IF NOT EXISTS idx_mutes_active ON mutes (is_active) WHERE is_active = TRUE;

-- warns table removed from Bridge (warnings handled by a separate Discord bot).
-- Existing deployments may still have an unused `warns` table; safe to DROP if desired.

-- =====================================================
-- guild_invites
-- =====================================================
CREATE TABLE IF NOT EXISTS guild_invites (
    id          TEXT PRIMARY KEY,
    uuid        TEXT NOT NULL,
    username    TEXT NOT NULL,
    invited_by  TEXT NOT NULL,
    invited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invites_uuid ON guild_invites (uuid);
CREATE INDEX IF NOT EXISTS idx_invites_invited_by ON guild_invites (invited_by);

-- =====================================================
-- gexp_daily (Guild Experience history per member)
-- =====================================================
CREATE TABLE IF NOT EXISTS gexp_daily (
    date            DATE NOT NULL,
    uuid            TEXT NOT NULL,
    username        TEXT NOT NULL,
    gexp_earned     INT NOT NULL DEFAULT 0,
    PRIMARY KEY (date, uuid)
);

CREATE INDEX IF NOT EXISTS idx_gexp_daily_uuid ON gexp_daily (uuid, date DESC);
CREATE INDEX IF NOT EXISTS idx_gexp_daily_date ON gexp_daily (date DESC);

-- Leaderboard RPC function for Supabase
CREATE OR REPLACE FUNCTION gexp_leaderboard(p_start DATE, p_end DATE, p_limit INT)
RETURNS TABLE(uuid TEXT, username TEXT, total BIGINT) AS $$
    SELECT uuid,
           (ARRAY_AGG(username ORDER BY date DESC))[1] AS username,
           SUM(gexp_earned)::BIGINT AS total
    FROM gexp_daily
    WHERE date >= p_start AND date <= p_end
    GROUP BY uuid
    ORDER BY total DESC
    LIMIT p_limit;
$$ LANGUAGE sql STABLE;

-- =====================================================
-- tournaments (Guild Tournament — Phase 1)
-- =====================================================
CREATE TABLE IF NOT EXISTS tournaments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'active', 'ended', 'cancelled')),
    metrics     JSONB NOT NULL DEFAULT '{}',
    starts_at   TIMESTAMPTZ NOT NULL,
    ends_at     TIMESTAMPTZ NOT NULL,
    channel_id  TEXT,
    created_by  TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at  TIMESTAMPTZ,
    ended_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments (status);

-- =====================================================
-- tournament_teams (Guild Tournament — Phase 2)
-- =====================================================
CREATE TABLE IF NOT EXISTS tournament_teams (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    captain_uuid    TEXT NOT NULL,
    pending_invites JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tournament_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tournament_teams_tid
    ON tournament_teams (tournament_id);

-- =====================================================
-- tournament_participants
-- =====================================================
CREATE TABLE IF NOT EXISTS tournament_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    uuid            TEXT NOT NULL,
    username        TEXT NOT NULL,
    baseline_stats  JSONB NOT NULL DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'left', 'disqualified')),
    team_id         UUID REFERENCES tournament_teams(id) ON DELETE SET NULL,
    qualifying_logins INT NOT NULL DEFAULT 0,
    enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tournament_id, uuid)
);

CREATE INDEX IF NOT EXISTS idx_tournament_participants_tid
    ON tournament_participants (tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_uuid
    ON tournament_participants (uuid);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_team
    ON tournament_participants (team_id);

-- Phase 2 migration for DBs that already had Phase 1 participants (no FK / index).
DO $$ BEGIN
    ALTER TABLE tournament_participants
        ADD CONSTRAINT tournament_participants_team_id_fkey
        FOREIGN KEY (team_id) REFERENCES tournament_teams(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_column THEN NULL;
END $$;

-- =====================================================
-- tournament_membership_segments
-- Tracks periods a player was in the guild during a tournament
-- (leave/rejoin foundation — only count progress while in guild)
-- =====================================================
CREATE TABLE IF NOT EXISTS tournament_membership_segments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    uuid            TEXT NOT NULL,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tournament_segments_tid_uuid
    ON tournament_membership_segments (tournament_id, uuid);

-- =====================================================
-- tournament_snapshots
-- =====================================================
CREATE TABLE IF NOT EXISTS tournament_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    uuid            TEXT NOT NULL,
    taken_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stats           JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_tournament_snapshots_tid_uuid
    ON tournament_snapshots (tournament_id, uuid, taken_at DESC);

-- =====================================================
-- tournament_week_results (Guild Tournament — Phase 3)
-- Frozen weekly sub-winners so digests can re-announce without recalc drift
-- =====================================================
CREATE TABLE IF NOT EXISTS tournament_week_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    week_number     INT NOT NULL CHECK (week_number >= 1),
    week_starts_at  TIMESTAMPTZ NOT NULL,
    week_ends_at    TIMESTAMPTZ NOT NULL,
    solo_podium     JSONB NOT NULL DEFAULT '[]',
    team_podium     JSONB NOT NULL DEFAULT '[]',
    frozen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tournament_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_tournament_week_results_tid
    ON tournament_week_results (tournament_id, week_number);

-- Phase 3: last daily digest timestamp (spam guard)
DO $$ BEGIN
    ALTER TABLE tournaments
        ADD COLUMN last_daily_digest_at TIMESTAMPTZ;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Phase 5: cumulative qualifying logins on participants
DO $$ BEGIN
    ALTER TABLE tournament_participants
        ADD COLUMN qualifying_logins INT NOT NULL DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- =====================================================
-- tournament_online_presence (Guild Tournament — Phase 5)
-- Open guild-chat online streak per player (Hypixel join/leave)
-- =====================================================
CREATE TABLE IF NOT EXISTS tournament_online_presence (
    uuid        TEXT PRIMARY KEY,
    username    TEXT NOT NULL,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    credited    BOOLEAN NOT NULL DEFAULT FALSE
);
