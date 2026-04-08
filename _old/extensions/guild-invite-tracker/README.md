# Guild Invite Tracker Extension

This extension automatically tracks guild member invites by monitoring guild logs when new members join.

## Features

- Detects when a new member joins the guild
- Automatically executes `/g log` to fetch recent guild activity
- Parses guild log to identify who invited the new member
- Sends structured invite information to Discord

## Configuration

```json
{
    "enabled": true,
    "logCheckDelay": 2000,
    "maxRetries": 3,
    "discordChannel": "staff"
}
```

### Configuration Options

- `enabled`: Enable/disable the extension (default: true)
- `logCheckDelay`: Delay in milliseconds before checking guild log after join (default: 2000ms)
- `maxRetries`: Maximum retries for log parsing (default: 3)
- `discordChannel`: Discord channel to send invite notifications (default: "staff")

## Usage

The extension automatically monitors guild member joins and provides detailed invite tracking without any manual intervention.

## Example Output

When a member joins with an invite, the extension will send a Discord embed to the staff bridge:

```
Player [MVP+] _7RC joined the guild!

They were invited by Richy135.
```

## Integration

This extension integrates with the existing guild member join detection system and extends it with invite tracking functionality.
