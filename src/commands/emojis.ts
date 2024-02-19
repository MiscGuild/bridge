import { ApplicationCommandOptionType, EmbedBuilder, GuildPremiumTier } from "discord.js";
import { Emoji, EmojiIds } from "../interfaces/EmojiIds";
import { VerboseHypixelRank, VerboseHypixelRanks } from "../interfaces/Ranks";
import { Command } from "../interfaces/Command";
import _emojiIds from "../util/emojis/_emojiIds.json";
import getEmojiBuffers from "../util/emojis/getEmojiBuffers";
import writeToJsonFile from "../util/writeToJsonFile";

export default {
	data: {
		name: "emojis",
		description: "Upload or remove Hypixel rank emojis",
		options: [
			{
				name: "upload",
				description: "Upload all Hypixel rank emojis to the server!",
				type: ApplicationCommandOptionType.Subcommand,
			},
			{
				name: "remove",
				description: "Remove all Hypixel rank emojis from the server!",
				type: ApplicationCommandOptionType.Subcommand,
			},
		],
	},
	run: async (bot, interaction) => {
		const type = interaction.options.getSubcommand() as "upload" | "remove";
		const emojiIds = _emojiIds as EmojiIds;

		await interaction.deferReply();

		if (type === "upload") {
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
				const rankName = Object.keys(VerboseHypixelRanks).find(
					(rank) => name.toString().replace(/[0-9]/g, "") === rank,
				) as VerboseHypixelRank | undefined;

				if (!rankName) {
					const embed = new EmbedBuilder()
						.setColor("Red")
						.setTitle("Error")
						.setDescription(`An unexpected error occured: Unkown emoji ${name}`);

					await interaction.editReply({ embeds: [embed] });
					return;
				}

				// Check if the rank has no value
				if (!emojiIds[rankName]) {
					emojiIds[rankName] = [];
				}

				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const emoji = await interaction.guild!.emojis.create({ attachment: buffer, name: name });
				(emojiIds[rankName] as Emoji[]).push({ name: emoji.name as string, id: emoji.id });
			}
		} else if (type === "remove") {
			for (const emojis of Object.values(emojiIds)) {
				for (const emoji of emojis) {
					try {
						bot.discord.emojis.cache.get(emoji.id)?.delete();
					} catch (e) {
						// Delete emoji anyhow, as to avoid causing errors in the future
						emojis.splice(emojis.indexOf(emoji));

						const embed = new EmbedBuilder()
							.setColor("Red")
							.setTitle("Error")
							.setDescription(`Failed to delete emoji ${emoji.name}`);

						await interaction.editReply({ embeds: [embed] });
						return;
					}

					emojis.splice(emojis.indexOf(emoji));
				}
			}
		}

		const successEmbed = new EmbedBuilder()
			.setColor("Green")
			.setTitle("✅ Done")
			.setDescription(`All Hypixel rank emojis have been ${type === "upload" ? "uploaded" : "removed"}!`);

		writeToJsonFile("./src/util/emojis/_emojiIds.json", emojiIds, interaction, successEmbed);
	},
	staffonly: true,
} as Command;
