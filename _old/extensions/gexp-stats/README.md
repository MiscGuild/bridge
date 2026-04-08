# GEXP Stats Extension

This extension provides guild experience (GEXP) statistics for Hypixel players with detailed weekly and daily breakdowns.

## Features

- **Weekly GEXP Total**: Shows total guild experience earned in the past 7 days
- **Daily GEXP**: Shows guild experience earned today
- **Daily Average**: Shows average daily guild experience over the past week
- **Smart Formatting**: Large numbers are formatted with K/M suffixes
- **Guild Member Lookup**: Finds players within their current guild
- **Cooldown System**: 1-minute cooldown for guild members, no cooldown for higher ranks

## Command

| Command            | Description           | Usage                                         |
| ------------------ | --------------------- | --------------------------------------------- |
| `!gexp [username]` | Check GEXP statistics | `!gexp Technoblade` or `!gexp` (for yourself) |

## Output Format

The extension provides formal, structured output:

```
[GEXP] IGN: PlayerName | Weekly: 75.2K | Daily: 8.1K | AVG: 10.7K | #randomcolor
```

Where:

- **IGN**: Player's in-game name
- **Weekly**: Total GEXP accumulated over the past 7 days
- **Daily**: GEXP earned today (most recent day in history)
- **AVG**: Average daily GEXP over the past week

## Configuration

```json
{
    "enabled": true,
    "hypixelApiKey": "your-api-key",
    "cleanupInterval": 300000
}
```

### Configuration Options

- `enabled`: Enable/disable the extension (default: true)
- `hypixelApiKey`: Hypixel API key (uses HYPIXEL_API_KEY environment variable)
- `cleanupInterval`: Cleanup interval for old cooldowns in milliseconds (default: 5 minutes)

## Error Handling

The extension handles various scenarios:

- **Player not found**: Invalid username or player doesn't exist
- **No guild**: Player is not in any guild
- **No GEXP data**: Player hasn't been active in the past 7 days
- **API errors**: Rate limiting, network issues, or API downtime
- **Invalid data**: Missing or corrupted guild experience history

## Cooldown System

- **Guild Members**: 1-minute cooldown between commands
- **Higher Ranks** (Elite Member, Moderator, Guild Master): No cooldown restrictions
- **Duplicate Prevention**: Prevents multiple simultaneous requests for the same player

## Technical Details

- **Data Source**: Hypixel Guild API endpoint
- **GEXP History**: Uses the `expHistory` field from guild member data
- **Time Range**: Always shows the past 7 days of available data
- **Number Formatting**: Automatically formats large numbers (1000+ = K, 1,000,000+ = M)

## Example Outputs

**Active Player:**

```
[GEXP] IGN: Technoblade | Weekly: 125.4K | Daily: 18.2K | AVG: 17.9K | #abc123
```

**Low Activity Player:**

```
[GEXP] IGN: CasualPlayer | Weekly: 5.2K | Daily: 0.8K | AVG: 0.7K | #def456
```

**No Data Available:**

```
[GEXP] IGN: InactivePlayer | No GEXP data found. Player may not have been active in the past 7 days. | #789abc
```

## Usage

Once loaded, the extension automatically registers the `!gexp` command pattern. Players can use:

1. `!gexp` - Check their own GEXP stats
2. `!gexp PlayerName` - Check another player's GEXP stats

The extension will fetch the player's guild membership, extract their GEXP history, and provide a formatted summary of their recent guild activity.
