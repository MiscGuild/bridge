import { ApplicationCommandOptionType, EmbedBuilder} from "discord.js";
import { Command } from "../interfaces/Command";
import { BotEvents } from "mineflayer";
//import capitaliseString from "../util/capitaliseString";

export default {
    data: {
        name: "guildlog",
        description: "Get the guild log!",
        options: [
			{
				name: "member",
				description: "What user do you want to check? - Optional",
				type: ApplicationCommandOptionType.String,
			},
			{
				name: "page",
				description: "What page do you want to check? - Optional",
				type: ApplicationCommandOptionType.String,
			},
		],
    },
    run: async (bot, interaction, args) => {
        const member: string = args[0];
		const page: number = args[1];

        if ((member && page) == undefined) {
            try {
                await bot.executeTask(`/g log`);
                
                // Create a array to store the guild log ins
                const gLogArray: string[] = [];
    
                // Set up a listener for the next 14 lines of chat
                let chatListener: BotEvents["message"];
                // The pattern we want to check the single message against multiple times is /(([A-Za-z]{3}\s[0-9]{1,2}\s[0-9]{4})\s(([0-9]{2}):([0-9]{2}))\s((EDT|EST): ))([A-Za-z-0-9-_]{2,27})\s(joined|left|invited|kicked)(?:\s)?([A-Za-z-0-9-_]{2,27})?(?:\s)?([A-Za-z-0-9-\/\.!-_-\s]+)?
                const regex = /(([A-Za-z]{3}\s[0-9]{1,2}\s[0-9]{4})\s(([0-9]{2}):([0-9]{2}))\s((EDT|EST): ))([A-Za-z-0-9-_]{2,27})\s(joined|left|invited|kicked)(?:\s)?([A-Za-z-0-9-_]{2,27})?(?:\s)?([A-Za-z-0-9-\/\.!-_-\s]+)?/;
                
                // Assume the guild log is 14 lines long, where it has 10 entries and the rest is not important
                // We want to match only the 10 entries, so we need to check if the message matches the pattern 10 times
                // If it does, add the message to the array and continue listening
                // If it doesn't, then stop listening
                
                bot.mineflayer.on("message", chatListener = async (message) => {
                    bot.logger.error("Trying to match regex...");
                    const messageContent = message.toString(); // Access the message content as a string
                    const match = regex.exec(messageContent);
    
                    let counter = 1;
    
                    while (match && counter < 10) {
                        const logEntry = match[0];
                        if (logEntry) {
                            const logEntryLines = logEntry.split("\n");
                            const filteredLines = logEntryLines.filter(line => regex.test(line));
                            gLogArray.push(filteredLines.join("\n"));
                            counter++;
                        }
                        if (counter == 10) {
                            bot.logger.log("Counter is 10!");
                            bot.logger.log("Matches found!\n" + logEntry);
                            bot.mineflayer.removeListener("message", chatListener);
    
                            const embed = new EmbedBuilder()
                        .setAuthor({
                                name: "Guild Log",
                                iconURL: "https://media.discordapp.net/attachments/522930879413092388/849317688517853294/misc.png",
                            })
                        .setColor("Red")
                        .setFooter({ text: `Made with <3 from Vliegenier04` })
                        .setThumbnail(`https://media.discordapp.net/attachments/522930879413092388/849317688517853294/misc.png`)
                        .setTimestamp()
                        .setTitle(`Guild Logger`)
                        .setURL(`https://vliegenier04.dev`)
                        .setDescription(`This is Guild Log\n\n ${logEntry}`)
    
                        await interaction.reply({ embeds: [embed] });
    
                        }
                        
                        
                        }
                    })
                    
                } catch (err) {
                bot.logger.error(err);
            }
        } else if (member == undefined) {
            try {
                await bot.executeTask(`/g log ${page}`);
                
                // Create a array to store the guild log ins
                const gLogArray: string[] = [];
    
                // Set up a listener for the next 14 lines of chat
                let chatListener: BotEvents["message"];
                // The pattern we want to check the single message against multiple times is /(([A-Za-z]{3}\s[0-9]{1,2}\s[0-9]{4})\s(([0-9]{2}):([0-9]{2}))\s((EDT|EST): ))([A-Za-z-0-9-_]{2,27})\s(joined|left|invited|kicked)(?:\s)?([A-Za-z-0-9-_]{2,27})?(?:\s)?([A-Za-z-0-9-\/\.!-_-\s]+)?
                const regex = /(([A-Za-z]{3}\s[0-9]{1,2}\s[0-9]{4})\s(([0-9]{2}):([0-9]{2}))\s((EDT|EST): ))([A-Za-z-0-9-_]{2,27})\s(joined|left|invited|kicked)(?:\s)?([A-Za-z-0-9-_]{2,27})?(?:\s)?([A-Za-z-0-9-\/\.!-_-\s]+)?/;
                
                // Assume the guild log is 14 lines long, where it has 10 entries and the rest is not important
                // We want to match only the 10 entries, so we need to check if the message matches the pattern 10 times
                // If it does, add the message to the array and continue listening
                // If it doesn't, then stop listening
                
                bot.mineflayer.on("message", chatListener = async (message) => {
                    bot.logger.error("Trying to match regex...");
                    const messageContent = message.toString(); // Access the message content as a string
                    const match = regex.exec(messageContent);
    
                    let counter = 1;
    
                    while (match && counter < 10) {
                        const logEntry = match[0];
                        if (logEntry) {
                            const logEntryLines = logEntry.split("\n");
                            const filteredLines = logEntryLines.filter(line => regex.test(line));
                            gLogArray.push(filteredLines.join("\n"));
                            counter++;
                        }
                        if (counter == 10) {
                            bot.logger.log("Counter is 10!");
                            bot.logger.log("Matches found!\n" + logEntry);
                            bot.mineflayer.removeListener("message", chatListener);
    
                            const embed = new EmbedBuilder()
                        .setAuthor({
                                name: "Guild Log",
                                iconURL: "https://media.discordapp.net/attachments/522930879413092388/849317688517853294/misc.png",
                            })
                        .setColor("Red")
                        .setFooter({ text: `Made with <3 from Vliegenier04` })
                        .setThumbnail(`https://media.discordapp.net/attachments/522930879413092388/849317688517853294/misc.png`)
                        .setTimestamp()
                        .setTitle(`Guild Logger`)
                        .setURL(`https://vliegenier04.dev`)
                        .setDescription(`This is Guild Log ${page}\n\n ${logEntry}`)
    
                        await interaction.reply({ embeds: [embed] });
    
                        }
                        
                        
                        }
                    })
                    
                } catch (err) {
                bot.logger.error(err);
            }
        } else {
            try {
                await bot.executeTask(`/g log ${member} ${page}`);
                
                // Create a array to store the guild log ins
                const gLogArray: string[] = [];
    
                // Set up a listener for the next 14 lines of chat
                let chatListener: BotEvents["message"];
                // The pattern we want to check the single message against multiple times is /(([A-Za-z]{3}\s[0-9]{1,2}\s[0-9]{4})\s(([0-9]{2}):([0-9]{2}))\s((EDT|EST): ))([A-Za-z-0-9-_]{2,27})\s(joined|left|invited|kicked)(?:\s)?([A-Za-z-0-9-_]{2,27})?(?:\s)?([A-Za-z-0-9-\/\.!-_-\s]+)?
                const regex = /(([A-Za-z]{3}\s[0-9]{1,2}\s[0-9]{4})\s(([0-9]{2}):([0-9]{2}))\s((EDT|EST): ))([A-Za-z-0-9-_]{2,27})\s(joined|left|invited|kicked)(?:\s)?([A-Za-z-0-9-_]{2,27})?(?:\s)?([A-Za-z-0-9-\/\.!-_-\s]+)?/;
                
                // Assume the guild log is 14 lines long, where it has 10 entries and the rest is not important
                // We want to match only the 10 entries, so we need to check if the message matches the pattern 10 times
                // If it does, add the message to the array and continue listening
                // If it doesn't, then stop listening
                
                bot.mineflayer.on("message", chatListener = async (message) => {
                    bot.logger.error("Trying to match regex...");
                    const messageContent = message.toString(); // Access the message content as a string
                    const match = regex.exec(messageContent);
    
                    let counter = 1;
    
                    while (match && counter < 10) {
                        const logEntry = match[0];
                        if (logEntry) {
                            const logEntryLines = logEntry.split("\n");
                            const filteredLines = logEntryLines.filter(line => regex.test(line));
                            gLogArray.push(filteredLines.join("\n"));
                            counter++;
                        }
                        if (counter == 10) {
                            bot.logger.log("Counter is 10!");
                            bot.logger.log("Matches found!\n" + logEntry);
                            bot.mineflayer.removeListener("message", chatListener);
    
                            const embed = new EmbedBuilder()
                        .setAuthor({
                                name: "Guild Log",
                                iconURL: "https://media.discordapp.net/attachments/522930879413092388/849317688517853294/misc.png",
                            })
                        .setColor("Red")
                        .setFooter({ text: `Made with <3 from Vliegenier04` })
                        .setThumbnail(`https://media.discordapp.net/attachments/522930879413092388/849317688517853294/misc.png`)
                        .setTimestamp()
                        .setTitle(`Guild Logger`)
                        .setURL(`https://vliegenier04.dev`)
                        .setDescription(`This is Guild Log ${member} ${page}\n\n ${logEntry}`)
    
                        await interaction.reply({ embeds: [embed] });
    
                        }
                        
                        
                        }
                    })
                    
                } catch (err) {
                bot.logger.error(err);
            }
        }
    },
} as Command;