<h1 align="center">Miscellaneous Guild Bridge</h1>

<p align="center">
    A feature-rich Discord ↔ Hypixel guild chat bridge bot for the Miscellaneous guild.
</p>

<h3 align="center">
    <a href="https://github.com/MiscGuild/bridge/stargazers">
        <img alt="Stars" src="https://img.shields.io/github/stars/MiscGuild/bridge?color=blue"/>
    </a>
    <a href="https://github.com/MiscGuild/bridge/forks">
        <img alt="Forks" src="https://img.shields.io/github/forks/MiscGuild/bridge">
    </a>
    <a href="https://discord.gg/dEsfnJkQcq">
        <img alt="Guild Discord" src="https://img.shields.io/discord/522586672148381726?label=discord&color=blue&logo=discord&logoColor=blue"/>
    </a>
</h3>

> [!WARNING]
> This application logs into Minecraft using Mineflayer, a JavaScript API for Minecraft. This may be against the rules of some servers and could result in punishment. All contributors to this repository are not liable for damages, and no warranty is provided under the [MIT License](LICENSE).

---

- [Features](#features)
- [Commands](#commands)
    - [In-game (Guild Chat)](#in-game-guild-chat)
    - [Discord Slash Commands](#discord-slash-commands)
- [Installation](#installation)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
    - [Environment Variables](#environment-variables)
    - [Database (Supabase)](#database-supabase)
    - [Process Management](#process-management)
- [License](#license)

---

## Features

- **Bidirectional chat bridge** — Guild chat and Officer chat ↔ Discord channels
- **Rich Discord embeds** for all guild events (joins, leaves, kicks, mutes, promotions)
- **Officer channel notifications** — invite tracking, Coral cheater alerts, auto-kicks, all as rich embeds
- **Guild invite tracker** — detects who invited a new member via `/g log`, stores history
- **Dual blacklist system**
    - _Guild Blacklist_ — blocks players from the guild, supports expiry
    - _Coral Tags_ — real-time cheater tag checks via [Coral API](https://api.urchin.gg) on join
- **Mute system** — syncs in-game guild mutes to a Discord Muted role (auto-expires)
- **Networth** — SkyBlock profile net worth calculation via skyhelper-networth
- **GEXP history** — tracks daily guild experience, leaderboard with bar chart, player graphs
- **30+ stat commands** — BedWars, SkyWars, Duels, UHC, Pit, SkyBlock, Networth, and more
- **Session tracking** — track stat gains during a play session
- **Guild tournaments (Phase 1–5)** — weighted delta leaderboard, teams, weekly sub-winners, Coral auto-DQ, qualifying logins (≥15m guild-chat presence), channel digests, Discord commands
- **Dynamic guild ranks** — fetches rank names and tags from Hypixel API with .env fallback
- **Analytics** — daily message counts, top chatters, guild event tracking
- **REST API** — protected endpoints for guild data, stats, analytics, GEXP, moderation
- **Health monitoring** — periodic snapshots and uptime tracking
- **Configurable cooldowns** per guild rank tier
- **Filters** — profanity filter, brainrot filter
- **Reminders** — periodic in-game announcements
- **Supabase or JSON fallback** for all persistent storage

---

## Commands

### In-game (Guild Chat)

> Commands work in both Guild Chat (`gc`) and Officer Chat (`oc`). Responses are sent back to the same channel.

#### Stats

| Command                                                                                             | Description                                                        |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `!bw [player]`                                                                                      | BedWars overall stats                                              |
| `!bw solo/doubles/threes/fours/4v4 [player]`                                                        | BedWars by mode                                                    |
| `!sw [player]`                                                                                      | SkyWars stats                                                      |
| `!duels [player]`                                                                                   | Duels overall stats                                                |
| `!uhcduels / !swduels / !classicduels / !bowduels / !opduels / !comboduels / !potionduels [player]` | Duels by mode                                                      |
| `!uhc [player]`                                                                                     | UHC stats                                                          |
| `!mm [player]`                                                                                      | Murder Mystery stats                                               |
| `!bb [player]`                                                                                      | Build Battle stats                                                 |
| `!arcade [player]`                                                                                  | Arcade stats                                                       |
| `!tnt [player]`                                                                                     | TNT Games stats                                                    |
| `!cvc [player]`                                                                                     | Cops and Crims stats                                               |
| `!mw [player]`                                                                                      | Mega Walls stats                                                   |
| `!pit [player]`                                                                                     | Pit stats (prestige, level, kills, KDR, gold)                      |
| `!gexp [player]`                                                                                    | Guild EXP — today and weekly total                                 |
| `!guild [player]`                                                                                   | Player guild info — guild name, rank + tag, weekly GEXP, join date |
| `!sb [player]`                                                                                      | SkyBlock overview                                                  |
| `!skills / !slayers / !dungeons [player]`                                                           | SkyBlock sub-stats                                                 |
| `!nw / !networth [player]`                                                                          | SkyBlock net worth (total, unsoulbound, purse, bank)               |

#### Comparison

| Command                                                | Description                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| `!bwvs <p1> <p2>`                                      | Compare two players' overall BedWars stats side-by-side              |
| `!bwvs <mode> <p1> <p2>`                               | Compare a specific BW mode (solo/doubles/threes/fours/4v4)           |
| `!bw <p1> vs <p2>`                                     | Same as `!bwvs` — overall comparison                                 |
| `!bw <mode> <p1> vs <p2>`                              | Same as `!bwvs <mode>` — comparison by mode                          |

#### Next Calculators (BedWars)

| Command                                | Description                                                                                  |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `!nfkdr [player] [target]`             | Final kills needed (assuming 0 deaths) to reach target FKDR. Default target: next 0.5 step.  |
| `!nbblr [player] [target]`             | Beds broken needed (assuming 0 beds lost) to reach target BBLR. Default target: next 0.5.    |
| `!nlevel [player] [star] [avg_xp]`     | XP & games needed to reach a target star. Default target: next prestige. Default avg: 150.   |


#### Sessions

| Command                                             | Description                   |
| --------------------------------------------------- | ----------------------------- |
| `!bwsession / !swsession / !cvcsession`             | Start a stat tracking session |
| `!endbwsession / !endswsession / !endcvcsession`    | End session and show gains    |
| `!showbwsession / !showswsession / !showcvcsession` | Show current session progress |

#### GEXP Leaderboard

| Command           | Description                                         |
| ----------------- | --------------------------------------------------- |
| `!gexptop [days]` | Top 5 GEXP earners over the last N days (default 7) |

#### Invite Tracker

| Command              | Description                      |
| -------------------- | -------------------------------- |
| `!invites [player]`  | View invite history for a player |
| `!inviteleaderboard` | Top 5 inviters                   |

#### Moderation (Staff Only — Officer Chat)

| Command                                       | Description                                                        |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `!ban <player> <reason>`                      | Bridge-ban a player                                                |
| `!unban <player>`                             | Remove bridge-ban                                                  |
| `!ismuted <player>`                           | Check mute status (works in GC and OC)                             |
| `!blacklist view <player>`                    | Check Coral blacklist tags                                         |
| `!blacklist add <player> <reason> [duration]` | Add to guild blacklist                                             |
| `!blacklist remove <player>`                  | Remove from guild blacklist                                        |
| `!blacklist list`                             | List all blacklisted players                                       |
| `!reboot`                                     | Restart the bot                                                    |
| `!save`                                       | Force-save JSON data                                               |

---

### Discord Slash Commands

| Command                            | Description                                  |
| ---------------------------------- | -------------------------------------------- |
| `/blacklist check/add/remove/list` | Manage guild blacklist and check Coral tags  |
| `/gexp player <username> [days]`   | Player GEXP history graph                    |
| `/gexp leaderboard [days] [top]`   | Guild GEXP leaderboard with chart            |
| `/gexp sync`                       | Force-sync GEXP data from Hypixel            |
| `/mute mute/unmute/info`           | Manage Discord mute role sync                |
| `/kick <player> [reason]`          | Kick from guild                              |
| `/invite <player>`                 | Invite to guild                              |
| `/promote / /demote <player>`      | Promote or demote a guild member             |
| `/announce <message>`              | Send guild announcement                      |
| `/slowmode <seconds>`              | Set bridge channel slowmode                  |
| `/command <cmd>`                   | Execute arbitrary Minecraft command          |
| `/next level <ign> <levelwanted> [avg_exp]` | Games & XP needed to reach a target BedWars star (avg_exp default 150) |
| `/tournament create/start/end/cancel` | Staff: manage guild tournament lifecycle |
| `/tournament info` | Tournament status, participant/team/week counts |
| `/tournament leaderboard [type] [top] [id]` | Solo or team weighted leaderboard (`type`: solo\|team) |
| `/tournament me [username] [id]` | Personal standing, deltas, and team if any |
| `/tournament weeks [week] [id]` | Weekly sub-winners or live current-week standing |
| `/tournament digest [id]` | Staff: force-post daily digest to tournament channel |
| `/tournament dq/undq <player> [id]` | Staff: manual disqualify / clear DQ |
| `/tournament team create/invite/join/leave/kick/info/list` | Phase 2 team lifecycle (max 5) |

#### Tournament Phase 1–5 notes

- Scoring uses **full-window deltas** × the **balanced** weight pack (Duels 1, TNT/BB/Party 3, SW 5, BW wins 9, BW final kills 2.5, GEXP 0.02, qualifying login 20).
- `/tournament start` snapshots all current guild members and opens membership segments (leave/rejoin only counts in-guild progress).
- Announces go to the tournament's `channel` option, or `TOURNAMENT_CHANNEL_ID` if set.
- **Teams (Phase 2):** max 5 players; hybrid team score = `0.7 × average + 0.3 × (sum / 5)` from active members only (left/DQ excluded). Solo and team podiums are announced separately on end. Create/invite/join/leave/kick only while draft or active. Captain leave transfers to earliest-enrolled remaining member, or disbands if alone. One team per player per tournament; join requires a captain invite.
- **Weekly slices (Phase 3):** week 1 = `starts_at` → +7d, then successive 7-day windows until `ends_at` (partial final week OK). **Weekly score** = in-window delta from nearest snapshots (membership segments still apply). Overall leaderboard formula is unchanged. Completed weeks are **frozen** into `tournament_week_results` so re-announce does not drift. Daily digest (top movers + solo top 10 + team top 5) posts once/day at `TOURNAMENT_DAILY_DIGEST_HOUR` UTC; weekly job announces solo/team top 3 sub-winners.
- **Coral auto-DQ (Phase 4):** players with Coral tags `caution`, `closet cheater`, `blatant cheater`, or `sniper` (case/spacing normalized; exact match after normalize — e.g. `possible sniper` does not match) are set to `disqualified`. Checked on tournament start/enroll, on guild join into an active tournament, and on a periodic job (`TOURNAMENT_CORAL_CHECK_INTERVAL_MINUTES`). One channel embed per DQ event. Staff can `/tournament dq` / `/tournament undq`. Requires `URCHIN_API_KEY`; if unset, Coral checks are skipped (guild blacklist kick behavior is unchanged).
- **Qualifying logins (Phase 5):** bridge `Guild > player joined/left.` presence starts a continuous online streak; after **≥15 minutes** continuous, +1 `qualifying_logins` (weight 20) for active participants. Leaving guild chat/offline or leaving guild membership closes the streak (no partial credit). Counts persist on the participant and are merged into snapshot stats for scoring deltas.

---

## Installation

### Prerequisites

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en/) 18+ and npm
- A full-access Minecraft Java Edition account
- A Hypixel API key ([developer.hypixel.net](https://developer.hypixel.net/dashboard))

### Setup

1. Clone the repository:

```bash
git clone https://github.com/MiscGuild/bridge.git
cd bridge
```

2. Install dependencies:

```bash
npm install
```

3. Create a Discord bot at the [Discord Developer Portal](https://discord.com/developers/applications). Under the **Bot** tab, enable **Message Content Intent**.

4. Invite the bot to your server using OAuth2 with scopes `bot` and `application.commands`.

5. Run the setup script to generate `.env`:

```bash
npm run setup-files
```

6. Fill in `.env` with your credentials (see [Environment Variables](#environment-variables)).

7. Promote the Minecraft bot account to **Officer** in-game so it can read Officer Chat and run privileged commands.

8. Build and start:

```bash
npm run build
npm start
```

---

### Environment Variables

#### Required

| Variable               | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `MINECRAFT_EMAIL`      | Minecraft account email                             |
| `HYPIXEL_API_KEY`      | Hypixel API key                                     |
| `HYPIXEL_GUILD_NAME`   | Your guild name (used for rank fetching, GEXP sync) |
| `DISCORD_TOKEN`        | Discord bot token                                   |
| `DISCORD_SERVER_ID`    | Your Discord server ID                              |
| `DISCORD_INVITE_LINK`  | e.g. `discord.gg/yourcode`                          |
| `MEMBER_CHANNEL_ID`    | Guild chat bridge channel                           |
| `OFFICER_CHANNEL_ID`   | Officer chat bridge channel                         |
| `BLACKLIST_CHANNEL_ID` | Blacklist log channel                               |
| `BOT_OWNER_ID`         | Your Discord user ID                                |
| `STAFF_ROLE_ID`        | Staff role ID for command gating                    |

#### Optional — Tournament

| Variable | Description |
| -------- | ----------- |
| `TOURNAMENT_CHANNEL_ID` | Default channel for tournament create/start/end embeds |
| `TOURNAMENT_RESNAPSHOT_INTERVAL_MINUTES` | Active tournament resnapshot interval (default `30`) |
| `TOURNAMENT_DAILY_DIGEST_HOUR` | UTC hour (0–23) for daily digest post (default `18`) |
| `TOURNAMENT_WEEKLY_CHECK_INTERVAL_MINUTES` | How often to check for week rollovers (default `60`) |
| `TOURNAMENT_CORAL_CHECK_INTERVAL_MINUTES` | Coral auto-DQ sweep interval for active tournaments (default `60`) |

#### Optional — Minecraft & API

| Variable                       | Description                               |
| ------------------------------ | ----------------------------------------- |
| `MINECRAFT_PASSWORD`           | Password (omit for Microsoft auth)        |
| `FALLBACK_HYPIXEL_API_KEY`     | Secondary API key for rate limit fallback |
| `2ND_FALLBACK_HYPIXEL_API_KEY` | Tertiary API key                          |

#### Optional — Discord Roles

| Variable                | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `BRIDGE_MUTED_ROLE_ID`  | Role that blocks bridge chat access               |
| `MUTED_ROLE_ID`         | Role for full server mute (synced with `/g mute`) |
| `BRIDGE_ACCESS_ROLE_ID` | Role granting bridge access to non-members        |
| `GUILD_MEMBER_ROLE_IDS` | Comma-separated member role IDs                   |

#### Optional — Supabase

| Variable               | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `SUPABASE_URL`         | Supabase project URL (uses JSON files if omitted) |
| `SUPABASE_ANON_KEY`    | Supabase anon key                                 |
| `SUPABASE_SERVICE_KEY` | Supabase service role key                         |

#### Optional — REST API / Dashboard

| Variable                | Description                     |
| ----------------------- | ------------------------------- |
| `API_PORT`              | REST API port (default: `3001`) |
| `API_KEY`               | API key for protected endpoints |
| `JWT_SECRET`            | JWT secret for dashboard auth   |
| `DISCORD_CLIENT_ID`     | Discord OAuth client ID         |
| `DISCORD_CLIENT_SECRET` | Discord OAuth client secret     |
| `DISCORD_REDIRECT_URI`  | Discord OAuth redirect URI      |

#### Optional — Filters & Reminders

| Variable                | Description                                   |
| ----------------------- | --------------------------------------------- |
| `USE_PROFANITY_FILTER`  | Enable profanity filter (default: `true`)     |
| `USE_BRAINROT_FILTER`   | Enable brainrot term filter (default: `true`) |
| `MINIMUM_NETWORK_LEVEL` | Minimum Hypixel network level to use bridge   |
| `REMINDER_ENABLED`      | Enable periodic in-game reminders             |
| `REMINDER_MESSAGE`      | Reminder message text                         |
| `REMINDER_FREQUENCY`    | Reminder interval in minutes                  |

#### Optional — Moderation

| Variable            | Description                            |
| ------------------- | -------------------------------------- |
| `BAN_ALLOWED_RANKS` | Ranks allowed to use ban commands      |
| `URCHIN_JOIN_CHECK` | Auto-check new joins against Coral tags (requires `URCHIN_API_KEY`) |
| `URCHIN_API_KEY`    | Coral API key (`https://api.urchin.gg`)                             |

#### Optional — Cooldowns & Rank Fallbacks

| Variable                                                    | Description                                                 |
| ----------------------------------------------------------- | ----------------------------------------------------------- |
| `COOLDOWN_RANK_1` – `COOLDOWN_RANK_5`                       | Command cooldowns per rank tier in seconds                  |
| `COOLDOWN_LEADER`                                           | Guild master cooldown (default: `0`)                        |
| `RANK_1_NAME` / `RANK_1_TAG` – `RANK_5_NAME` / `RANK_5_TAG` | Fallback rank names and tags (used when API is unavailable) |
| `RANK_LEADER_TAG`                                           | Guild master tag (default: `GM`)                            |

#### Optional — Misc

| Variable          | Description                      |
| ----------------- | -------------------------------- |
| `ENABLE_TERMINAL` | Enable interactive terminal REPL |

---

### Database (Supabase)

All data defaults to local JSON files in `data/`. To use Supabase, set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`, then run the schema:

```sql
-- Run src/db/schema.sql in your Supabase SQL editor
```

Tables: `guild_members`, `chat_messages`, `analytics_daily`, `analytics_chatters`, `sessions`, `bans`, `blacklist`, `mutes`, `guild_invites`, `gexp_daily`, `audit_log`, `webhooks`, `bot_health`.

---

### Process Management

Use [PM2](https://pm2.keymetrics.io/) to keep the bot running in the background:

```bash
npm run pm2:start    # Start
npm run pm2:kill     # Stop
npm run pm2:restart  # Restart
npm run pm2:logs     # View logs
```

---

## License

This is an open-source project licensed under the [MIT License](LICENSE).
