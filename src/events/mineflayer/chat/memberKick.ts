import Emojis from "../../../util/emojis";
import { Event } from "../../../interfaces/Event";
import { escapeMarkdown } from "discord.js";
import fs from "fs";

export default {
	name: "chat:memberKick",
	runOnce: false,
	run: async (
		bot,
		rank: string | undefined,
		playerName: string,
		kickedByRank: string | undefined,
		kickedByPlayerName: string,
	) => {

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
					console.log("playerJoinDateJSON:", playerJoinDateJSON);

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

		await bot.sendToDiscord(
			"gc",
			`${Emojis.negativeGuildEvent} **${rank ? rank + " " : ""}${escapeMarkdown(playerName)}** was kicked by **${
				kickedByRank ? kickedByRank + " " : ""
			}${escapeMarkdown(kickedByPlayerName)}**`,
			undefined,
			true,
		);
	},
} as Event;
