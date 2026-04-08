# Duplicate Message Handler Extension

## Overview

This extension detects when the bot receives the "You cannot say the same message twice!" error from Hypixel and responds with a varied, random alternative message to avoid repetitive responses.

## Features

- **Automatic Detection**: Monitors for the exact duplicate message error from Hypixel
- **Varied Responses**: Responds with one of 10 different alternative messages
- **Random Selection**: Each response is randomly selected to keep interactions fresh
- **Configurable**: Easy to add, remove, or modify response messages
- **Random Hex Colors**: Each response includes a random hex color code

## Configuration

### config.json

```json
{
    "enabled": true,
    "responses": [
        "I'm sorry, but I can't say the same message twice!",
        "Oops! Hypixel won't let me repeat that message.",
        "My bad! I just tried to send the exact same thing again.",
        "Whoops! Hypixel is blocking duplicate messages.",
        "Sorry about that! Can't send identical messages back-to-back.",
        "Apologies! Hypixel prevents me from repeating messages.",
        "Darn! I tried to say the same thing twice by accident.",
        "Uh oh! Hypixel caught me trying to duplicate a message.",
        "Sorry! The anti-spam system blocked my repeated message.",
        "My mistake! Hypixel doesn't allow identical consecutive messages."
    ]
}
```

### Configuration Options

- `enabled` (boolean): Enable/disable the extension (default: true)
- `responses` (array): List of alternative response messages

## How It Works

1. **Detection**: The extension listens for the exact message: "You cannot say the same message twice!"
2. **Random Selection**: When detected, it randomly selects one of the configured alternative responses
3. **Response**: Sends the alternative message to guild chat with a random hex color
4. **Logging**: Logs the detection and response for debugging purposes

## Example Responses

- "I'm sorry, but I can't say the same message twice! | #a3b4c5"
- "Oops! Hypixel won't let me repeat that message. | #f1e2d3"
- "My bad! I just tried to send the exact same thing again. | #8c9da0"

## Building

```bash
npm run build
```

## Development

```bash
npm run dev  # Watch mode for development
```

## Version

1.0.0

## Author

MiscGuild Bridge Bot Team
