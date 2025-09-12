<h1 align="center">Miscellaneous Guild Bridge</h1>

<p align="center">
    A bot used to Bridge between Discord and Hypixel guild chats.
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

> [!Warning]
> This application will log into Minecraft using Mineflayer, a JavaScript API for Minecraft. This may be against the rules of some servers and could result in punishment. All contributors to this repository are not liable for damages, and no warranty is provided under the [MIT License](https://github.com/MiscGuild/bridge/blob/master/LICENSE).

> [!Note]
> This application will no longer receive updates that contain new features or QOL improvements. Updates, where necessary, will only contain patches for security vulnerabilities and bugs.

-   [Features](#features)
-   [Installation](#installation)
    -   [Prerequisites](#prerequisites)
    -   [Setup](#setup)
    -   [Hypixel API keys](#hypixel-api-keys)
    -   [Process management](#process-management)
-   [Contributing](#contributing)
    -   [Issues and bug reports](#issues-and-bug-reports)
-   [Acknowledgements](#acknowledgements)
-   [License](#license)

## Features

-   Bridges between Discord and Hypixel guild chats.
-   Sends all guild related messages, including chat, guild announcements and more to Discord.
-   Automatic restarts and reconnections.
-   Privileged slash commands to control bot behaviour in-game.
-   Toggleable slowmode to control member usage.
-   Basic filtering of extreme profanity to protect bot accounts from abuse.
-   Configurable in-game reminders to spread the word about news and upcoming events.
-   **🔌 Mineflayer Extension System**: Universal plugin system for extending bot functionality with custom chat commands and patterns.

## Mineflayer Extension System

This bridge includes a powerful extension system that allows you to add custom functionality without modifying the core bot code. Create extensions that respond to chat patterns, handle commands, and integrate with Discord.

### Quick Start with Extensions

```bash
# Build the extension system
./build-extensions.sh

# Test the extension system
node test-extensions.mjs

# Create a new extension
node src/plugin-system/mineflayer-extension-cli.js create "My Extension"

# List extensions
node src/plugin-system/mineflayer-extension-cli.js list
```

### Features

- **Chat Pattern Routing**: Automatically routes chat messages to appropriate extensions
- **Priority System**: Handle conflicts between patterns with priority levels
- **Hot Reloading**: Reload extensions without restarting the bot
- **Discord Integration**: Built-in Discord webhook and message support
- **Configuration Management**: Schema-based config validation
- **Health Monitoring**: Monitor extension health and performance
- **CLI Tools**: Command-line interface for managing extensions

See the [Extension Documentation](src/plugin-system/MINEFLAYER_EXTENSIONS.md) for detailed guides and examples.

## Installation

### Prerequisites

-   [Git](https://git-scm.com/downloads)
-   [NodeJS](https://nodejs.org/en/) and npm
-   A full access Minecraft Java Edition account

### Setup

1. Install [pnpm](https://pnpm.io/) via one of their [installation methods](https://pnpm.io/installation), or the following command:

```bash
$ npm install -g pnpm
```

2. Clone the repository into a directory of your choice.

```bash
$ git clone https://github.com/MiscGuild/bridge.git
```

3. Enter the new directory and install packages.

```bash
$ cd bridge
$ pnpm install
```

4. Make a new Discord bot account on the [Discord Developer Portal](https://discord.com/developers/applications) and retrieve the bot token.

5. Under the `Bot` tab, grant the bot the `Message Content` Intent.

6. Generate an invite URL by going to the OAuth2 tab and clicking on the URL Generator. Add the `bot` and `application.commands` scopes, before opening the link to invite the bot to your server.

7. Setup the project config files.

```bash
$ pnpm run setup-files
```

8. Fill out the `.env` file with your Minecraft account email and other details.

9. Promote the Minecraft account used by the bot to Officer in-game in order for it to view the Officer chat and run privileged commands.

10. On Hypixel, set the account's `Private Message Privacy` setting under `My Profile > Social Settings` to `Low` or `High`, allowing guild members to privately message the bot to see their weekly guild experience total.

11. Build and run the bot.

```bash
$ pnpm run build
$ pnpm start
```

### Hypixel API keys

After the June 2023 [Hypixel Public API update](https://hypixel.net/threads/hypixel-developer-dashboard-public-api-changes-june-2023.5364455/), Development API Keys now expire after three days but can be easily renewed.

To acquire a permanent key, first generate a Development Key [here](https://developer.hypixel.net/dashboard). Then, fill out the form under `Apps > Create app > Personal API Key`. Please note that applications concerning bridge bots may be denied.

Alternatively, you may omit the `HYPIXEL_API_KEY` field of the `.env` file, but some features such as minimum network level enforcement will be disabled.

### Process management

If you are self-hosting or your process manager does not automatically restart the bot in the event of a crash, you may use [PM2](https://pm2.keymetrics.io/), a process manager for Node.js applications.

Use the `pm2:start` script instead of the `start` script to launch the bot. To stop the process, use the `pm2:kill` script.

```bash
$ pnpm run pm2:start
$ pnpm run pm2:kill
```

Please refer to the [PM2 documentation](https://pm2.keymetrics.io/docs/usage/quick-start/) for more configuration options and information about PM2.

## Contributing

Pull requests are welcome. If you would like to chat with other developers please join our [Discord](https://discord.gg/bHFWukp).

Before submitting your changes for review, please ensure:

-   The application is fully functional
-   Your code has been thoroughly tested
-   Your commit messages adhere to the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/).

Give this repository a ⭐ if it helped you!

### Issues and bug reports

To raise an issue or bug report, please contact a developer or [open an issue](https://github.com/MiscGuild/bridge/issues).

## Acknowledgements

Parts of this project adapt code from the following repositories:

-   [hychat-mc/self-host](https://github.com/hychat-mc/self-host) under the MIT License.
	- [xMdb/hypixel-guild-chat-bot](https://github.com/xmdb/hypixel-guild-chat-bot) originally licensed under the GPL-3.0 License, relicensed under the MIT License with explicit permission from the original author.
-   [unaussprechlich/hypixel-api-typescript](https://github.com/unaussprechlich/hypixel-api-typescript) under the MIT License.

## License

This is an open-source project licensed under the [MIT License](https://github.com/MiscGuild/bridge/blob/master/LICENSE).
