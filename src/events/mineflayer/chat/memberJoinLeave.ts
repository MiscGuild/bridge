import Emojis from "../../../util/emojis";
import { Event } from "../../../interfaces/Event";
import { escapeMarkdown } from "discord.js";
import fetchMojangProfile from "../../../util/requests/fetchMojangProfile";
import isFetchError from "../../../util/requests/isFetchError";
import isUserBlacklisted from "../../../util/blacklist/isUserBlacklisted";
import getRankColor from "../../../util/getRankColor";
import { BotEvents } from "mineflayer";
import fs from "fs";

export default {
	name: "chat:memberJoinLeave",
	runOnce: false,
	run: async (bot, rank: string | undefined, playerName: string, type: "joined" | "left") => {
		if (type === "joined") {
			const mojangProfile = await fetchMojangProfile(playerName);

			if (!isFetchError(mojangProfile) && isUserBlacklisted(mojangProfile.id)) {
				bot.executeCommand(
					`/g kick ${playerName} You have been blacklisted from the guild. Mistake? --> ${process.env.DISCORD_INVITE_LINK}`,
				);
			}
		}

		if (type === "joined") {
			await new Promise((resolve) => {
				bot.executeTask(`/g log ${playerName} 1`);
				let chatListener2: BotEvents["message"];

				// Declare Regex separately to avoid TypeScript errors.
				const monthDayYearRegex = "([A-Za-z]{3}\\s[0-9]{1,2}\\s[0-9]{4})";
				const hourMinuteRegex = "(([0-9]{2}):([0-9]{2}))";
				const timezoneRegex = "((EDT|EST): )";
				const usernameRegex = "([A-Za-z-0-9-_]{2,27})";
				const actionRegex =
					"(joined|left|invited|kicked|muted|unmuted|set rank of|set MOTD|set guild tag|set guild tagcolor)";
				const optionalSpaceRegex = "(?:\\s)?";
				const optionalToRegex = "(stos)?";
				const optionalSecondUsernameRegex = `(${usernameRegex})?`;
				const optionalAdditionalInfoRegex = `([A-Za-z-0-9-!-_\\s]+)?`;

				// This is the array that will store the log entries.
				const logEntriesArray = [] as string[];

				bot.mineflayer.on(
					"message",
					(chatListener2 = async (message) => {
						const messageContent = message.toString();
						let counter = 0;
						const logEntries = messageContent.split("\n");

						for (const logEntry of logEntries) {
							const regex = new RegExp(
								`${monthDayYearRegex}\\s${hourMinuteRegex}\\s${timezoneRegex}${usernameRegex}\\s${actionRegex}${optionalSpaceRegex}${optionalSecondUsernameRegex}${optionalToRegex}${optionalSpaceRegex}${optionalAdditionalInfoRegex}`,
								"g",
							);

							let match;
							while ((match = regex.exec(logEntry)) !== null && counter <= 2) {
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
									await bot.logger.error(
										`invitedPlayer:`,
										invitedPlayer,
										`action:`,
										action,
										`userName:`,
										userName,
										`regex used:`,
										regex,
									);

									await bot.sendToDiscord(
										"oc",
										`${Emojis.positiveGuildEvent} **${escapeMarkdown(
											userName,
										)}** invited **${escapeMarkdown(invitedPlayer)}** to the guild!`,
									);

									resolve(invitedPlayer);
									bot.mineflayer.removeListener("message", chatListener2);

									async function updateJoinData(playerName: string) {
										try {
											const response = await fetch(
												`https://api.mojang.com/users/profiles/minecraft/${playerName}`,
											);
											const uuid = (await response.json()).id;
											console.log(uuid);

											const playerJoinData = [
												{
													player: uuid,
													username: playerName,
													joinDate: new Date(),
													leaveDate: null,
												},
											];

											fs.writeFileSync("joinDate.json", JSON.stringify(playerJoinData, null, 2));
											console.log("Data has been written to the file");
										} catch (error) {
											console.error(error);
										}
									}
									updateJoinData(playerName);
								} else if (counter === 2) {
									await bot.sendToDiscord(
										"oc",
										`${Emojis.positiveGuildEvent} **${escapeMarkdown(
											playerName,
										)}** ${type} the guild! **They weren't invited by anyone.**`,
									);
									bot.mineflayer.removeListener("message", chatListener2);
									resolve(playerName);
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

									// Get the UUID of the new member from the Hypixel API
									const response = await fetch(
										`https://api.mojang.com/users/profiles/minecraft/${playerName}`,
									);
									const uuid = (await response.json()).id;
									console.log(uuid);

									// Enter the player UUID with their join date into the joinDate.json file

									const playerJoinDate = [
										{
											player: uuid,
											username: playerName,
											joinDate: new Date(),
											leaveDate: null,
										},
									];
									// If files exists, append the new data to the file
									const joinDateJSON = JSON.stringify(playerJoinDate, null, 2);

									fs.writeFileSync("joinDate.json", joinDateJSON);
									console.log("Data has been written to the file");

									//The above is only to catch all the data and TypeScript wants me to use it.
								}
							}
						}
					}),
				);
			});

			await bot.sendToDiscord(
				"gc",
				`${type === "joined" ? Emojis.positiveGuildEvent : Emojis.negativeGuildEvent} **${
					rank ? rank + " " : ""
				}${escapeMarkdown(playerName)}** ${type} the guild!`,
				getRankColor(rank),
				true,
			);
		}

		if (type === "left") {
			async function updateLeaveData(playerName: string) {
				try {
					// Get the UUID of the new member from the Hypixel API
					const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${playerName}`);
					const uuid = (await response.json()).id;
					console.log(uuid);

					try {
						const playerJoinDate = fs.readFileSync("joinDate.json", "utf-8");
						if (!playerJoinDate.trim()) {
							console.log("The joinDate.json file is empty.");
							return;
						}
						const playerJoinDateJSON = JSON.parse(playerJoinDate);

						// Find the UUID in the joinDate.json file. If it doesn't exists, return "Player not found, did they join before this script was made?"
						const playerIndex = playerJoinDateJSON.findIndex(
							(player: { player: string }) => player.player === uuid,
						);	
						if (playerIndex === -1) {
							console.log("Player not found, did they join before this script was made?");
							await bot.sendToDiscord(
								"oc",
								`${Emojis.negativeGuildEvent} **${escapeMarkdown(
									playerName,
								)}** left the guild. They joined before this script was made.`,
								"#ff0000",
								true,
							);
							return;
						}
						console.log(playerIndex);
						// Get the current date
						const leaveDate = new Date();
						playerJoinDateJSON[playerIndex].leaveDate = leaveDate.toISOString();
						console.log("Updated Player Object:", playerJoinDateJSON[playerIndex]);

						// Write the updated data back to the file
						fs.writeFileSync("joinDate.json", JSON.stringify(playerJoinDateJSON, null, 2));
						console.log("Data has been written to the file");

						// Send the difference in years, days and mintues between the join and leave date to discord
						const joinDate = new Date(playerJoinDateJSON[playerIndex].joinDate);
						const difference = leaveDate.getTime() - joinDate.getTime();
						const years = Math.floor(difference / 31536000000);
						const days = Math.floor((difference % 31536000000) / 86400000);
						const minutes = Math.floor((difference % 86400000) / 60000);
						await bot.sendToDiscord(
							"oc",
							`${Emojis.negativeGuildEvent} **${escapeMarkdown(
								playerName,
							)}** left the guild after **${years} years, ${days} days and ${minutes} minutes**.`,
							"#ff0000",
							true,
						);
					} catch (error) {
						console.error(error);
					}
				} catch (error) {
					console.error("Error reading or parsing joinDate.json:", error);
				}
			}

			await updateLeaveData(playerName);
		}
		return;
	},
} as Event;
