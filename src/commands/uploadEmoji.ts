import { VerboseHypixelRank, VerboseHypixelRanks } from "../interfaces/Ranks";
import { Command } from "../interfaces/Command";
import { EmojiIds } from "../interfaces/EmojiIds";
import { MessageEmbed } from "discord.js";
import _emojiIds from "../util/emojis/_emojiIds.json";
import getEmojiBuffers from "../util/emojis/getEmojiBuffers";
import writeToFile from "../util/writeToFile";

export default {
	data: {
		name: "uploademojis",
		description: "Upload all Hypixel rank emojis to the server!",
		type: "CHAT_INPUT",
	},
	staffOnly: true,
	run: async (_bot, interaction) => {
		await interaction.deferReply();

		const tier = interaction.guild?.premiumTier;
		const maxEmojis = tier === "TIER_1" ? 100 : tier === "TIER_2" ? 150 : tier === "TIER_3" ? 250 : 50;
		const emojiIds = _emojiIds as EmojiIds;
		const emojiBuffers = await getEmojiBuffers();

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		if (interaction.guild!.emojis.cache.size + Object.keys(emojiBuffers).length > maxEmojis) {
			const embed = new MessageEmbed()
				.setColor("RED")
				.setTitle("Error")
				.setDescription(
					`Not enough emoji slots! This command requires ${Object.keys(emojiBuffers).length} open slots.`,
				);
			interaction.editReply({ embeds: [embed] });
			return;
		}

		for (const [name, buffer] of Object.entries(emojiBuffers)) {
			const rankName = Object.values(VerboseHypixelRanks).find(
				(rank) => typeof rank === "string" && name.includes(rank),
			) as VerboseHypixelRank | undefined;

			if (rankName) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const emoji = await interaction.guild!.emojis.create(buffer, name);
				emojiIds[rankName].push({ name: emoji.name as string, id: emoji.id });
			} else {
				const embed = new MessageEmbed()
					.setColor("RED")
					.setTitle("Error")
					.setDescription(`An unexpected error occured: Unkown emoji of name ${name}`);
				interaction.editReply({ embeds: [embed] });
				return;
			}
		}

		const successEmbed = new MessageEmbed()
			.setColor("GREEN")
			.setTitle("Completed")
			.setDescription("All Hypixel rank emojis have been uploaded!");

		writeToFile("./src/util/emojis/_emojiIds.json", emojiIds, interaction, successEmbed);
	},
} as Command;
