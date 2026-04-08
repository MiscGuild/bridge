# Hypixel Stats Extension

This extension provides comprehensive Hypixel player statistics checking with support for all major game modes through a modular architecture.

## Features

- **Multi-Game Mode Support**: Bedwars, SkyWars, Duels, UHC, Build Battle, Murder Mystery, TNT Games, Mega Walls, Arcade
- **Modular Architecture**: Each game mode has its own dedicated handler for maintainability
- **Smart Cooldown System**: Prevents spam with per-user cooldowns
- **Rich Statistics**: Detailed stats with ratios, levels, and formatted displays
- **Error Handling**: Comprehensive error handling for API failures and invalid usernames

## Supported Commands

| Command              | Game Mode      | Description                                    |
| -------------------- | -------------- | ---------------------------------------------- |
| `!bw <username>`     | Bedwars        | Shows stars, wins, losses, finals, beds broken |
| `!sw <username>`     | SkyWars        | Shows level, wins, losses, kills, deaths       |
| `!duels <username>`  | Duels          | Shows overall wins, losses, and best game mode |
| `!uhc <username>`    | UHC            | Shows wins, kills, deaths, and score           |
| `!bb <username>`     | Build Battle   | Shows score, wins, and correct guesses         |
| `!mm <username>`     | Murder Mystery | Shows wins, kills, and best role               |
| `!tnt <username>`    | TNT Games      | Shows wins across all TNT game modes           |
| `!mw <username>`     | Mega Walls     | Shows wins, kills, deaths, and best class      |
| `!arcade <username>` | Arcade         | Shows wins across arcade games                 |

## Configuration

```json
{
    "enabled": true,
    "cooldownDuration": 5000,
    "apiTimeout": 10000
}
```

### Configuration Options

- `enabled`: Enable/disable the extension (default: true)
- `cooldownDuration`: Cooldown duration in milliseconds between stat requests per user (default: 5000ms)
- `apiTimeout`: API request timeout in milliseconds (default: 10000ms)

## Architecture

The extension follows a modular architecture:

```
hypixel-stats/
├── index.ts              # Main extension class
├── types/
│   └── index.ts          # TypeScript type definitions
├── utils/
│   └── index.ts          # Utility functions (API calls, formatting)
└── handlers/
    ├── index.ts          # Handler exports
    ├── bedwars.ts        # Bedwars statistics handler
    ├── skywars.ts        # SkyWars statistics handler
    ├── duels.ts          # Duels statistics handler
    ├── uhc.ts            # UHC statistics handler
    ├── buildbattle.ts    # Build Battle statistics handler
    ├── murdermystery.ts  # Murder Mystery statistics handler
    ├── tntgames.ts       # TNT Games statistics handler
    ├── megawalls.ts      # Mega Walls statistics handler
    └── arcade.ts         # Arcade statistics handler
```

## Usage

Once loaded, the extension automatically registers all game mode patterns and handles stat requests:

1. Players use commands like `!bw Technoblade` in guild chat
2. Extension checks cooldowns and validates the username
3. Fetches data from Mojang and Hypixel APIs
4. Processes stats through the appropriate game mode handler
5. Sends formatted results to guild chat

## Error Handling

The extension handles various error scenarios:

- Invalid usernames
- Player not found
- API timeouts
- Rate limiting
- Missing game mode data

## Development

Each game mode handler implements the `StatsHandler` interface:

```typescript
interface StatsHandler {
    buildStatsMessage(playerData: HypixelPlayerProfile, username: string): string;
}
```

To add a new game mode:

1. Create a new handler in the `handlers/` directory
2. Implement the `StatsHandler` interface
3. Add the handler to the exports in `handlers/index.ts`
4. Add the command pattern to the main extension
