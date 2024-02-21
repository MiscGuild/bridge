import { ApplicationCommandOptionType } from "discord.js";
import { Command } from "../interfaces/Command";
import { BotEvents } from "mineflayer";

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
		const member = args[0];
		const page = args[1];

		const logCommand = `/g log${member ? ` ${member}` : ""}${page ? ` ${page}` : ""}`;

		try {
			await bot.executeTask(logCommand);

			let chatListener: BotEvents["message"];

			const monthDayYearRegex = "([A-Za-z]{3}\\s[0-9]{1,2}\\s[0-9]{4})";
			const hourMinuteRegex = "(([0-9]{2}):([0-9]{2}))";
			const timezoneRegex = "((EDT|EST): )";
			const usernameRegex = "([A-Za-z-0-9-_]{2,27})";
			const actionRegex = "(joined|left|invited|kicked|muted|unmuted|set rank of)";
			const optionalSpaceRegex = "(?:\\s)?";
			const optionalToRegex = "(stos)?";
			const optionalSecondUsernameRegex = `(${usernameRegex})?`;
			const optionalAdditionalInfoRegex = `([A-Za-z-0-9-!-_\\s]+)?`;
			const logEntriesArray = [] as string[];

			/*const regex =
				/(([A-Za-z]{3}\s[0-9]{1,2}\s[0-9]{4})\s(([0-9]{2}):([0-9]{2}))\s((EDT|EST): ))([A-Za-z-0-9-_]{2,27})\s(joined|left|invited|kicked|muted|unmuted|set rank of)(?:\s)?([A-Za-z-0-9-_]{2,27})?(?:\s)?([A-Za-z-0-9-\\!-_-\s]+)?/;*/

			bot.mineflayer.on(
				"message",
				(chatListener = async (message) => {
					const messageContent = message.toString();
					let counter = 0;
					const logEntries = messageContent.split("\n");

					for (const logEntry of logEntries) {
						const regex = new RegExp(
							`${monthDayYearRegex}\\s${hourMinuteRegex}\\s${timezoneRegex}${usernameRegex}\\s${actionRegex}${optionalSpaceRegex}${optionalSecondUsernameRegex}${optionalToRegex}${optionalSpaceRegex}${optionalAdditionalInfoRegex}`,
							"g",
						);

						let match;
						const logEntryMatches = [];
						while ((match = regex.exec(logEntry)) !== null && counter < 10) {
							const [
								fullMatch,
								date,
								time,
								hour,
								minute,
								timezone,
								year,
								primaryUsername,
								action,
								day,
								secondUsername,
								additionalInfo,
							] = match;

							let description = "";
							description += `**Date:** \`${date}\`\n**Time: \`${hour}:${minute}\`**\n**Timezone:** \`${timezone}\`\n`;
							description += `**Username:** \`${primaryUsername}\`\n`;
							description += `**Action:** \`${action}\`\n`;
							if (secondUsername) description += `**Second Username:** \`${secondUsername}\`\n`;
							description += `**Additional Info:** \`${additionalInfo}\`\n`;
							description += `||**Full Match:** \`${fullMatch}\`||\n`;
							description += `\n`;
							description += `\n**-----------------------------------------------------**`;
							counter++;
							logEntryMatches.push(description);

							bot.logger.error("Error, couln't find a home for: ", time, year, day);
						}
						const concatenatedArray = logEntryMatches.flat().join("\n");
						logEntriesArray.push(concatenatedArray);

						if (counter >= 10) {
							bot.mineflayer.removeListener("message", chatListener);
						}
					}
					const concatenatedLogs = logEntriesArray.flat().join("\n");
					bot.sendToDiscord("lc", concatenatedLogs, "Aqua");
				}),
			);
			interaction.reply({ content: "You can find your guild log in the Log Channel." });
		} catch (err) {
			bot.logger.error(err);
		}
	},
	staffOnly: true,
} as Command;
