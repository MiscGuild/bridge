# Fun Bot Extension

A playful extension that responds to various messages with funny and entertaining replies.

## Features

- 🎯 **Smart Pattern Matching**: Responds to pings, greetings, mentions, and questions
- 🎭 **Multiple Response Variations**: Random responses to keep conversations fresh
- ⏱️ **Configurable Response Delays**: Natural timing with customizable delays
- 🎮 **Channel Support**: Works in Guild, Officer, Party, and Private messages
- 🤖 **Playful Personality**: Friendly bot with emojis and humor

## Configuration

Create a `config.json` file in the extension directory to customize behavior:

```json
{
  "responseDelay": 500,
  "minDelay": 200,
  "maxDelay": 2000,
  "randomDelayVariation": 0.3,
  "enabled": true
}
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `responseDelay` | `500` | Base delay in milliseconds before responding |
| `minDelay` | `200` | Minimum response delay (ms) |
| `maxDelay` | `2000` | Maximum response delay (ms) |
| `randomDelayVariation` | `0.3` | Random variation factor (0-1, 0.3 = ±30%) |
| `enabled` | `true` | Enable/disable the extension |

## Features

- ✅ Chat pattern handling


## Usage


### Chat Commands

- `!fun-bot` - Example command



## Development

- `npm run build` - Build TypeScript
- `npm run dev` - Watch mode for development

## Author

Unknown

## Version

1.0.0
