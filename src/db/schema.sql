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
