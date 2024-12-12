// Regex Pattern:
// 'chat:bw-stats': /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?: (.*)!bw\s?(\w{2,17})?$/,
// Copyright © 2024 Vliegenier04

const commandCooldowns = new Map<string, number>();

export default {
    name: 'chat:sw-stats',
    runOnce: false,
    run: async (
        bot,
        channel: string,
        playerRank: string,
        playerName: string,
        guildRank: string,
        unknownGroup: string,
        target: string
    ) => {

        const _channel = channel;
        const _playerRank = playerRank;
        const _playerName = playerName;
        const _guildRank = guildRank;
        const _unknownGroup = unknownGroup;
        const _target = target;

        const now = Date.now();
        const cooldownTime = 4 * 60 * 1000; 

        if (commandCooldowns.has(playerName) && _guildRank.includes('Active')) {
            const lastRun = commandCooldowns.get(playerName);
            if (lastRun && now - lastRun < cooldownTime) {
                const remainingTime = Math.ceil((cooldownTime - (now - lastRun)) / 1000);
                bot.executeCommand(
                    `/gc ${playerName}, you can only use this command again in ${remainingTime} seconds. Please wait.`
                );
                return;
            }
        }

        commandCooldowns.set(playerName, now);
        
        if (_target === undefined || _target === null || _target === '') {
            if (_guildRank.includes('Member')) {
                bot.executeCommand(
                    `/gc ${_playerName}, you must have Guild Rank "Active" or higher to check the stats of ${_playerName}! Aborting...`
                );
            } else if (
                _guildRank.includes('Active') ||
                _guildRank.includes('Res') ||
                _guildRank.includes('Mod') ||
                _guildRank.includes('Admin') ||
                _guildRank.includes('GM')
            ) {
                return new Promise((resolve, reject) => {
                    fetch(
                        `https://api.hypixel.net/player?key=${process.env.HYPIXEL_API_KEY}&name=${_playerName}`
                    )
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success === false && data.cause === "You have already looked up this name recently") {
                                console.log(
                                    `[DEBUG] ${_playerName} is checking the stats of ${_playerName}, but failed.`
                                );
                                bot.executeCommand(
                                    `/gc ${_playerName}, the player ${_playerName} was looked up recently. Please try again later.`
                                );
                                return reject('Player not found!');
                            } else if (data.success === true && data.player === null) {
                                console.log(
                                    `[DEBUG] ${_playerName} is checking the stats of ${_playerName}, but failed.`
                                );
                                bot.executeCommand(
                                    `/gc ${_playerName}, the player ${_playerName} was not found.`
                                );
                                return reject('Player not found!');
    
                            }
            
                            if (!data.player.stats || !data.player.stats.SkyWars || !data.player.achievements) {
                                console.log(
                                    `[DEBUG] ${_playerName} is checking the stats of ${_playerName}, but incomplete data was received.`
                                );
                                return reject('Incomplete player data received!');
                            }
            
                            const playerStats = data.player.stats.SkyWars;
                            const playerAchievements = data.player.achievements;
            
                            const playerLevel = playerStats.levelFormatted;
                            const rm_playerLevel = playerLevel.split(new RegExp('§[a-zA-Z0-9]'))[1];

                            const playerWinsSolo = playerAchievements.skywars_wins_solo;
                            const playerWinsTeams = playerAchievements.skywars_wins_team;
                            const playerKillsSolo = playerAchievements.skywars_kills_solo;
                            const playerKillsTeams = playerAchievements.skywars_kills_team;
                            const playerWins = playerWinsSolo + playerWinsTeams;
                            const playerKills = playerKillsSolo + playerKillsTeams;
                            const playerDeaths = playerStats.skywars_deaths;
                            const playerKDR = playerKills / playerDeaths;
                            const playerLosses = playerStats.losses;
                            const playerWLR = playerWins / playerLosses;
            
                            console.log(
                                `[DEBUG] ${_playerName} is checking the SW stats of ${_target} and succeeded`
                            );
            
                            bot.executeCommand(
                                `/gc [SW-STATS] IGN: ${_playerName} | LVL: ${rm_playerLevel} | WINS: ${playerWins} | KDR: ${playerKDR} | BBLR: ${playerLosses} | WLR: ${playerWLR.toFixed(2)}`
                            );
            
                            resolve(data.player); // Ensure promise resolves
                        })
                        .catch((err) => {
                            console.error(`[ERROR] Failed to fetch player stats: ${err}`);
                            reject(err);
                        });
                });
            }
        } else {
            if (_guildRank.includes('Member')) {
                bot.executeCommand(
                    `/gc ${_playerName}, you must have Guild Rank "Active" or higher to check the stats of ${_target}! Aborting...`
                );
            } else if (
                _guildRank.includes('Active') ||
                _guildRank.includes('Res') ||
                _guildRank.includes('Mod') ||
                _guildRank.includes('Admin') ||
                _guildRank.includes('GM')
            ) {
                return new Promise((resolve, reject) => {
                    fetch(
                        `https://api.hypixel.net/player?key=${process.env.HYPIXEL_API_KEY}&name=${_target}`
                    )
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success === false && data.cause === "You have already looked up this name recently") {
                                console.log(
                                    `[DEBUG] ${_playerName} is checking the stats of ${_target}, but failed.`
                                );
                                bot.executeCommand(
                                    `/gc ${_playerName}, the player ${_target} was looked up recently. Please try again later.`
                                );
                                return reject('Player not found!');
                            } else if (data.success === true && data.player === null) {
                                console.log(
                                    `[DEBUG] ${_playerName} is checking the stats of ${_target}, but failed.`
                                );
                                bot.executeCommand(
                                    `/gc ${_playerName}, the player ${_target} was not found.`
                                );
                                return reject('Player not found!');
                            }
            
                            if (!data.player.stats || !data.player.stats.SkyWars || !data.player.achievements) {
                                console.log(
                                    `[DEBUG] ${_playerName} is checking the stats of ${_target}, but incomplete data was received.`
                                );
                                return reject('Incomplete player data received!');

                            }
            
                            const playerStats = data.player.stats.SkyWars;
                            const playerAchievements = data.player.achievements;
            
                            const playerLevel = playerStats.levelFormatted;
                            const rm_playerLevel = playerLevel.split(new RegExp('§[a-zA-Z0-9]'))[1];

                            const playerWinsSolo = playerAchievements.skywars_wins_solo;
                            const playerWinsTeams = playerAchievements.skywars_wins_team;
                            const playerKillsSolo = playerAchievements.skywars_kills_solo;
                            const playerKillsTeams = playerAchievements.skywars_kills_team;
                            const playerWins = playerWinsSolo + playerWinsTeams;
                            const playerKills = playerKillsSolo + playerKillsTeams;
                            const playerDeaths = playerStats.deaths;
                            const playerKDR = playerKills / playerDeaths;
                            const playerLosses = playerStats.losses;
                            const playerWLR = playerWins / playerLosses;
            
                            console.log(
                                `[DEBUG] ${_playerName} is checking the SW stats of ${_target} and succeeded`
                            );
            
                            bot.executeCommand(
                                `/gc [SW-STATS] IGN: ${_target} | LVL: ${rm_playerLevel} | WINS: ${playerWins} | KDR: ${playerKDR.toFixed(2)} | WLR: ${playerWLR.toFixed(2)} | Total Kills: ${playerKills}`
                            );
            
                            resolve(data.player); // Ensure promise resolves
                        })
                        .catch((err) => {
                            console.error(`[ERROR] Failed to fetch player stats: ${err}`);
                            reject(err);
                        });
                });
            }
        }
    },
} as Event;
