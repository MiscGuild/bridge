import { EmbedBuilder, GuildPremiumTier } from "discord.js";
import { VerboseHypixelRank, VerboseHypixelRanks } from "../interfaces/Ranks";
import { Command } from "../interfaces/Command";
import { EmojiIds } from "../interfaces/EmojiIds";
import _emojiIds from "../util/emojis/_emojiIds.json";
import getEmojiBuffers from "../util/emojis/getEmojiBuffers";
import writeToJsonFile from "../util/writeToJsonFile";

export default {
	data: {
		name: "uploademojis",
		description: "Upload all Hypixel rank emojis to the server!",
	},
	staffOnly: true,
	run: async (_bot, interaction) => {
		await interaction.deferReply();

		let maxEmojis: GuildPremiumTier;
		switch (interaction.guild?.premiumTier) {
			case GuildPremiumTier.Tier1:
				maxEmojis = 100;
				break;

			case GuildPremiumTier.Tier2:
				maxEmojis = 150;
				break;

			case GuildPremiumTier.Tier3:
				maxEmojis = 250;
				break;

			default:
				maxEmojis = 50;
				break;
		}
		const emojiIds = _emojiIds as EmojiIds;
		const emojiBuffers = await getEmojiBuffers();

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		if (interaction.guild!.emojis.cache.size + Object.keys(emojiBuffers).length > maxEmojis) {
			const embed = new EmbedBuilder()
				.setColor("Red")
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
				const emoji = await interaction.guild!.emojis.create({ attachment: buffer, name: name });
				emojiIds[rankName].push({ name: emoji.name as string, id: emoji.id });
			} else {
				const embed = new EmbedBuilder()
					.setColor("Red")
					.setTitle("Error")
					.setDescription(`An unexpected error occured: Unkown emoji of name ${name}`);

				await interaction.editReply({ embeds: [embed] });
				return;
			}
		}

		const successEmbed = new EmbedBuilder()
			.setColor("Green")
			.setTitle("Completed")
			.setDescription("All Hypixel rank emojis have been uploaded!");

		writeToJsonFile("./src/util/emojis/_emojiIds.json", emojiIds, interaction, successEmbed);
	},
} as Command;
