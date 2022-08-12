<h1 align="center">Miscellaneous Guild Bridge</h1>

<p align="center">
    A bot used to Bridge between Discord and Hypixel guild chats.
</p>

<h3 align="center">
    <a href="https://discord.gg/dEsfnJkQcq" alt="Guild Discord">
        <img src="https://img.shields.io/discord/522586672148381726?label=discord&style=for-the-badge&color=blue"/>
    </a>
    <img alt="Lines of Code" src="https://img.shields.io/tokei/lines/github/MiscGuild/bridge?color=blue&style=for-the-badge"/>
    <img alt="Stars" src="https://img.shields.io/github/stars/MiscGuild/bridge?color=blue&style=for-the-badge"/>
</h3>

> 🚨 USE AT YOUR OWN RISK:
> This application will log into Minecraft using Mineflayer, a Minecraft bot client. This may be against the rules of some servers and could result in punishment. All contributors to this repository are not liable for damages, and no warranty is provided under the [MIT License.](https://github.com/MiscGuild/bridge/blob/master/LICENSE)

-   [Features](#features)
-   [Installation](#installation)
    -   [Prerequisites](#prerequisites)
    -   [Setup](#setup)
-   [Contributing](#contributing)
    -   [Issues and Bug Reports](#issues-and-bug-reports)
-   [Acknowledgements](#acknowledgements)
-   [License](#license)

## Features

-   Bridges between Discord and Hypixel guild chats.
-   Sends all guild related messages, including chat, guild announcements and more to Discord.
-   Automatic restarts and reconnections.
-   Toggleable use of Discord emojis for Hypixel ranks in chat messages.
-   Privileged slash commands to control bot behaviour in-game.
-   Toggleable slowmode to slow and control member usage.

## Installation

### Prerequisites

-   [Git](https://git-scm.com/downloads)
-   [NodeJS](https://nodejs.org/en/) >=16.6.0 and npm
-   A full access Minecraft Java Edition account

### Setup

1. ⭐ Star this repository!
2. Clone the repository into a directory of your choice.

```bash
$ git clone https://github.com/MiscGuild/bridge.git
```

3. Enter the new directory and install packages.

```bash
$ cd bridge
$ npm install
```

4. Make a new Discord bot account on the [Discord Developer Portal](https://discord.com/developers/applications) and retrieve the bot token.

5. Under the `Bot` tab, grant the bot the `Message Content` Intent.

6. Generate an invite URL by going to the OAuth2 tab and clicking on the URL Generator. Add the `bot` and `application.commands` scopes, before opening the link to invite the bot to your server.

7. Fill out the `.env.template` file with your credentials and rename it to `.env`.

8. Remove the `.template` file endings from `src/util/_blacklist.json.template` and `src/util/emojis/_emojiIds.json.template`.

9. Promote the Minecraft account the bot uses to Officer in-game in order for it to view the Officer chat and run privileged commands.

10. Build and run the bot.

```bash
$ npm run build
$ npm start
```

Optionally, you may activate the use of rank emojis in discord messages by following these steps:

1. Run the `/emojis upload` command in a discord server of your choice. (Note: It is recommended to run this command in an alternate server, as it uses a significant number of emoji slots. In this case, only the user of id `BOT_OWNER_ID` is the only person with permission to run this command).

2. Set the value of `USE_RANK_EMOJIS` in the `.env` file to `true` (Use `false` to disable this feature).

If at any time you wish to delete the emojis created by the bot, run the `/emojis remove` command.

## Contributing

Pull requests are welcome. If you would like to chat with other developers please join our [Discord](https://discord.gg/bHFWukp) and go to `#programming-talk`.

Please ensure commit messages follow the [Angular Convention](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines) and all code has been tested before contributing.

### Issues and Bug Reports

To submit an issue or bug, please contact a developer or open an issue [here](https://github.com/MiscGuild/bridge/issues).

## Acknowledgements

Parts of this project use code from the following repositories:

-   [Hychat Self-Host](https://github.com/hychat-mc/self-host) Under MIT License.
-   [Hypixel API TypeScript](https://github.com/unaussprechlich/hypixel-api-typescript/) Under MIT License.

## License

This is an open-source project licensed under the [MIT License.](https://github.com/MiscGuild/bridge/blob/master/LICENSE)
