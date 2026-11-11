<h1 align="center">Miscellaneous Guild Bridge</h1>

<p align="center">
    Connects Hypixel guild chat and Discord through a Minecraft bot, for the Miscellaneous guild.
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

- [What it does](#what-it-does)
- [Commands](#commands)
- [Setup](#setup)
- [Configuration](#configuration)
- [Data](#data)
- [Running in production](#running-in-production)

## What it does

- **Bridges chat both ways.** Guild chat ↔ the member channel, officer chat ↔ the officer channel. Discord messages go through a profanity filter before reaching Minecraft.
- **Posts guild events to Discord:** joins and leaves, kicks, promotions, mutes, level-ups and quests. Officer chat also gets join requests, whispers, blocked messages, and who invited each new member.
- **Enforces a blacklist.** Blacklisted players are kicked when they join and by a regular guild scan. Temporary blacklists expire on their own, and get extended if the player gets back in.
- **Checks Coral (Urchin) cheater tags** with `!view`, `/blacklist check`, and optionally whenever someone joins.
- **Answers stat commands in-game**: BedWars, SkyWars, Duels, SkyBlock, and more.
- **Stays online.** It idles in Limbo, reconnects when kicked, and relogs when it gets stuck.

## Commands

### In-game

Use these in guild or officer chat; the reply goes to the chat you used. Most commands have a cooldown that depends on your guild rank (`COOLDOWN_RANK_*`).

**Stats** — leave out the player to look yourself up.

| Command                                                                                               | Shows                                                                           |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `!bw [mode] [player]`                                                                                 | BedWars, overall or for `solo`, `doubles`, `threes`, `fours`, `4v4`             |
| `!sw [player]`                                                                                        | SkyWars                                                                         |
| `!duels [player]`                                                                                     | Duels                                                                           |
| `!uhcduels` `!swduels` `!classicduels` `!bowduels` `!opduels` `!comboduels` `!potionduels` `[player]` | A Duels mode                                                                    |
| `!uhc` `!mm` `!bb` `!arcade` `!tnt` `!cvc` `!mw` `!pit` `[player]`                                    | UHC, Murder Mystery, Build Battle, Arcade, TNT, Cops and Crims, Mega Walls, Pit |
| `!sb [player]`                                                                                        | SkyBlock overview; also `!skills`, `!slayers`, `!dungeons`                      |
| `!nw [player]`                                                                                        | SkyBlock networth (also `!networth`)                                            |
| `!gexp [player]`                                                                                      | Guild XP today and this week                                                    |
| `!gexptop [days]`                                                                                     | Top 5 guild XP earners over the last 1–7 days (default 7)                       |
| `!guild [player]`                                                                                     | Guild, rank, weekly guild XP and join date                                      |

**BedWars tools**

| Command                                               | Does                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `!bwvs [mode] <p1> <p2>` or `!bw [mode] <p1> vs <p2>` | Compares two players                                               |
| `!nfkdr [player] [target]`                            | Final kills needed for an FKDR (default: the next 0.5)             |
| `!nbblr [player] [target]`                            | Beds needed for a BBLR (default: the next 0.5)                     |
| `!nlevel [player] [star] [xp_per_game]`               | XP and games to a star (default: next prestige at 150 XP per game) |

**Sessions** — track your stat gains while you play.

| Command                        | Does                    |
| ------------------------------ | ----------------------- |
| `!session <bw\|sw\|cvc> start` | Starts a session        |
| `!session <bw\|sw\|cvc>`       | Shows progress so far   |
| `!session <bw\|sw\|cvc> stop`  | Ends it with the totals |

**Blacklist and moderation** — everything except `!view` is staff-only. Staff means guild rank tier `STAFF_MIN_RANK` or higher, or the Guild Master. Staff confirmations go to officer chat.

| Command                                   | Does                                                                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `!view [player]`                          | Shows a player's blacklist entry and Coral tags                                                                                               |
| `!guild-ban <player> [duration] [reason]` | Blacklists the player and kicks them. Duration like `30m`, `12h`, `7d` or `2w`; leave it out for permanent. Also `!gban` and `!blacklist add` |
| `!blacklist remove <player>`              | Lifts a blacklist. Also `!unban`                                                                                                              |
| `!bridge-mute <name> [reason]`            | Stops a Discord member's messages reaching Minecraft (gives them `BRIDGE_MUTED_ROLE_ID`). Use the name their messages show in-game            |
| `!bridge-unmute <name>`                   | Undoes `!bridge-mute`                                                                                                                         |
| `!reboot`                                 | Restarts the bot (needs a process manager such as PM2 to bring it back)                                                                       |

### Discord

Staff commands need `STAFF_ROLE_ID` (or being `BOT_OWNER_ID`).

| Command                                     | Who   | Does                                                 |
| ------------------------------------------- | ----- | ---------------------------------------------------- |
| `/blacklist check\|add\|remove\|list`       | Staff | Manages the blacklist; `check` also shows Coral tags |
| `/guild invite\|kick\|promote\|demote`      | Staff | Runs the guild command in-game                       |
| `/guild announce <message>`                 | Staff | Sends a message to guild chat                        |
| `/guild online`                             | All   | Online guild members                                 |
| `/bridge mute\|unmute <user>`               | Staff | Gives or removes `BRIDGE_MUTED_ROLE_ID`              |
| `/command <command>`                        | Staff | Runs any Minecraft command                           |
| `/terminate`                                | Staff | Stops the bot process                                |
| `/next level <ign> <levelwanted> [avg_exp]` | All   | BedWars XP and games to a star                       |
| `/status`                                   | All   | Uptime and connection state                          |
| `/help`                                     | All   | Lists the commands                                   |

## Setup

You'll need:

- [Node.js](https://nodejs.org/) 18 or newer, and [pnpm](https://pnpm.io/installation)
- A Minecraft Java account (Microsoft login) that's in your guild with a rank that can use officer chat and invite, kick, promote and demote
- A [Hypixel API key](https://developer.hypixel.net/dashboard)
- A Discord bot from the [Developer Portal](https://discord.com/developers/applications) with the **Server Members** and **Message Content** intents turned on. Invite it with the `bot` and `applications.commands` scopes. In the bridge channels it needs View Channel, Send Messages and Manage Messages (it deletes each bridged message, which then comes back as an embed). Bridge-muting needs Manage Roles, with the bot's role above `BRIDGE_MUTED_ROLE_ID`.

Then:

```bash
git clone https://github.com/MiscGuild/bridge.git
cd bridge
pnpm install
cp .env.example .env      # then fill in the REQUIRED values
pnpm build
pnpm start
```

On the first start Mineflayer prints a Microsoft sign-in link and code in the console. After you sign in, the login is cached.

## Configuration

All settings live in `.env`. [`.env.example`](.env.example) lists every option with its default and what it does. Only these are required:

| Variable                                                          | What it is                                                                   |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `MINECRAFT_EMAIL`                                                 | The Minecraft account's email                                                |
| `HYPIXEL_API_KEY`, `HYPIXEL_GUILD_NAME`                           | Hypixel API key and your guild's name                                        |
| `DISCORD_TOKEN`                                                   | Discord bot token                                                            |
| `DISCORD_INVITE_LINK`                                             | Your server's invite (`discord.gg/...`), shown to kicked blacklisted players |
| `MEMBER_CHANNEL_ID`, `OFFICER_CHANNEL_ID`, `BLACKLIST_CHANNEL_ID` | Guild chat channel, officer chat channel, blacklist log                      |
| `STAFF_ROLE_ID`, `BOT_OWNER_ID`                                   | Who can use the staff slash commands                                         |

## Data

The bot keeps its data as JSON files in `data/`: the blacklist (`blacklist.json`) and running stat sessions (`active-sessions.json`). Back that folder up, and stop the bot before editing the files by hand.

**Moving from the old Supabase setup:** export the blacklist table into `data/blacklist.json` before starting the new version, using your project URL and service role key:

```bash
curl "$SUPABASE_URL/rest/v1/blacklist?select=*" -H "apikey: $SUPABASE_SERVICE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" --create-dirs -o data/blacklist.json
```

## Running in production

Use a process manager such as [PM2](https://pm2.keymetrics.io/) to keep the bot running:

```bash
pm2 start dist/index.js --name bridge
pm2 logs bridge
```

`!reboot` and `/terminate` both exit the process, so under PM2 they restart the bot. Use `pm2 stop bridge` to stop it for good. `pnpm build` clears `dist/` first, so code you've removed won't linger in old build output.

## License

This is an open-source project licensed under the [MIT License](LICENSE).
