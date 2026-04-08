# Brainrot Filter Extension

Filters "brainrot" / TikTok slang and meme terms from guild chat.

## Features

- **170+ built-in blocked terms** covering skibidi, sigma, gyatt, Italian brainrot memes, and more
- **Configurable action**: `warn` → `mute` after X warnings, `mute` immediately, or just `log`
- **Warning system**: configurable max warnings and reset timer before escalating to mute
- **Exempt ranks**: staff members can bypass the filter
- **Officer chat notifications**: alerts OC whenever the filter triggers
- **Custom allow/block lists**: add your own terms or whitelist false positives

## Configuration (config.json)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the extension |
| `action` | string | `"mute"` | Action to take: `"mute"`, `"warn"`, or `"log"` |
| `muteDuration` | string | `"1h"` | Hypixel mute duration (e.g. `"30m"`, `"1h"`, `"1d"`) |
| `warnBeforeMute` | boolean | `true` | Warn players before muting |
| `maxWarnings` | number | `2` | Number of warnings before muting |
| `warningResetMinutes` | number | `60` | Minutes before warnings reset |
| `notifyOfficerChat` | boolean | `true` | Send alert to officer chat |
| `customBlockedTerms` | string[] | `[]` | Extra terms to block |
| `customAllowedTerms` | string[] | `[]` | Terms to whitelist |
| `exemptRanks` | string[] | `[]` | Guild rank tags exempt from filter, e.g. `["[GM]", "[Arch]"]` |

## Examples

### Warn twice, then mute for 1 hour (default)
```json
{
    "enabled": true,
    "action": "mute",
    "muteDuration": "1h",
    "warnBeforeMute": true,
    "maxWarnings": 2
}
```

### Mute immediately, no warnings
```json
{
    "action": "mute",
    "warnBeforeMute": false,
    "muteDuration": "30m"
}
```

### Log-only mode (no mutes or warnings)
```json
{
    "action": "log",
    "notifyOfficerChat": true
}
```

### Exempt staff from the filter
```json
{
    "exemptRanks": ["[GM]", "[Arch]", "[Sent]"]
}
```
