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
    -   [Process Management](#process-management)
-   [Contributing](#contributing)
    -   [Issues and Bug Reports](#issues-and-bug-reports)
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

## Installation

### Prerequisites

-   [Git](https://git-scm.com/downloads)
-   [NodeJS](https://nodejs.org/en/) >=18.20.4 and npm
-   A full access Minecraft Java Edition account

### Setup

1. ⭐ Star this repository!
2. Install [pnpm](https://pnpm.io/) via one of their [installation methods](https://pnpm.io/installation), or the following command:

```bash
$ npm install -g pnpm
```

3. Clone the repository into a directory of your choice.

```bash
$ git clone https://github.com/MiscGuild/bridge.git
```

4. Enter the new directory and install packages.

```bash
$ cd bridge
$ pnpm install
```

5. Make a new Discord bot account on the [Discord Developer Portal](https://discord.com/developers/applications) and retrieve the bot token.

6. Under the `Bot` tab, grant the bot the `Message Content` Intent.

7. Generate an invite URL by going to the OAuth2 tab and clicking on the URL Generator. Add the `bot` and `application.commands` scopes, before opening the link to invite the bot to your server.

8. Setup the project config files.

```bash
$ pnpm run setup-files
```

9. Fill out the `.env` file with your credentials.

10. Promote the Minecraft account used by the bot to Officer in-game in order for it to view the Officer chat and run privileged commands.

11. Build and run the bot.

```bash
$ pnpm run build
$ pnpm start
```

### Process Management

If you are self-hosting or your process manager does not automatically restart the bot in the event of a crash, you may use [PM2](https://pm2.keymetrics.io/), a process manager for Node.js applications.

Use the `pm2:start` script instead of the `start` script to launch the bot. To stop the process, use the `pm2:kill` script.

```bash
$ pnpm run pm2:start
$ pnpm run pm2:kill
```

Please refer to the [PM2 documentation](https://pm2.keymetrics.io/docs/usage/quick-start/) for more configuration options and information about PM2.

## Contributing

Pull requests are welcome. If you would like to chat with other developers please join our [Discord](https://discord.gg/bHFWukp) and go to `#programming-talk`.

Before submitting your changes for review, please ensure:

-   The application is fully functional, and all your code has been thoroughly tested to avoid potential bugs or security vulnerabilities.
-   Your commit messages adhere to the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/).

### Issues and Bug Reports

To raise an issue or bug report, please contact a developer or [open an issue](https://github.com/MiscGuild/bridge/issues).

## Acknowledgements

Parts of this project use code from the following repositories:

-   [Hychat Self-Host](https://github.com/hychat-mc/self-host) under the MIT License.
-   [Hypixel API TypeScript](https://github.com/unaussprechlich/hypixel-api-typescript) under the MIT License.

## License

This is an open-source project licensed under the [MIT License](https://github.com/MiscGuild/bridge/blob/master/LICENSE).
