import Emojis from "../../../util/emojis/chatEmojis";
import { Event } from "../../../interfaces/Event";
import { HypixelRank } from "../../../interfaces/Ranks";
import { escapeMarkdown } from "discord.js";
import fetchMojangProfile from "../../../util/requests/fetchMojangProfile";
import getRankData from "../../../util/emojis/getRankData";
import isFetchError from "../../../util/requests/isFetchError";
import isUserBlacklisted from "../../../util/isUserBlacklisted";
import { BotEvents } from "mineflayer";

export default {
	name: "chat:memberJoinLeave",
	runOnce: false,
	run: async (bot, hypixelRank: HypixelRank | undefined, playerName: string, type: "joined" | "left") => {
		const [rank, color] = await getRankData(hypixelRank);

		if (type === "joined") {
			const mojangProfile = await fetchMojangProfile(playerName);

			if (!isFetchError(mojangProfile) && isUserBlacklisted(mojangProfile.id)) {
				bot.executeCommand(
					`/g kick ${playerName} You have been blacklisted from the guild. Mistake? --> ${process.env.DISCORD_INVITE_LINK}`,
				);
			}
		}

		if (type === "joined") {
			try {
				bot.executeTask(`/g log ${playerName} 1`);
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
							while ((match = regex.exec(logEntry)) !== null && counter < 2) {
								logEntriesArray.push(match[0]);
								counter++;

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

								if (counter === 2 && action === "invited") {
									const invitedPlayer = secondUsername as string;
									const userName = primaryUsername as string;
									bot.logger.error(
										`invitedPlayer:`,
										invitedPlayer,
										`action:`,
										action,
										`userName:`,
										userName,
									);

									await bot.sendToDiscord(
										"oc",
										`${Emojis.positiveGuildEvent} **${rank ? rank + " " : ""}${escapeMarkdown(
											userName,
										)}** invited **${escapeMarkdown(invitedPlayer)}** to the guild!`,
									);
									bot.mineflayer.removeListener("message", chatListener);
								} else if (counter === 2) {
									await bot.sendToDiscord(
										"oc",
										`${Emojis.positiveGuildEvent} **${rank ? rank + " " : ""}${escapeMarkdown(
											playerName,
										)}** ${type} the guild! **They weren't invited by anyone.**`,
									);
									bot.mineflayer.removeListener("message", chatListener);
									bot.logger.log(
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
									);
								}
							}
						}
					}),
				);
			} catch (error) {
				console.error(error);
			}
		}

		await bot.sendToDiscord(
			"gc",
			`${type === "joined" ? Emojis.positiveGuildEvent : Emojis.negativeGuildEvent} **${
				rank ? rank + " " : ""
			}${escapeMarkdown(playerName)}** ${type} the guild!`,
			color,
			true,
		);
	},
} as Event;
