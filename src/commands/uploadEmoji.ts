import { Command } from "../interfaces/DiscordCommand";
import { CommandInteraction, MessageEmbed } from "discord.js";
import fetchErrorEmbed from "../util/fetchErrorEmbed";
import fetchFakeChat from "../util/fetchFakeChat";
import getEmojiBuffers from "../util/emojis/getEmojiBuffers";
import isFetchError from "../util/isFetchError";

const guildRankColors = {
	Gray: "&7",
	"Dark Aqua": "&3",
	"Dark Green": "&2",
	Yellow: "&",
	Gold: "&6",
} as const;

export default {
	data: {
		name: "uploademoji",
		description: "Upload a guild rank emoji to a designated server!",
		options: [
			{
				name: "hypixelranks",
				description: "Upload all Hypixel rank emojis!",
				type: "SUB_COMMAND",
			},
			{
				name: "guildrank",
				description: "Upload a guild rank emoji!",
				type: "SUB_COMMAND",
				options: [
					{
						name: "color",
						description: "What color is the guild rank?",
						type: "STRING",
						choices: Object.entries(guildRankColors).map(([key, value]) => {
							return { name: key, value: value };
						}),
						required: true,
					},
					{
						name: "name",
						description: "What is the name of the guild rank?",
						type: "STRING",
						required: true,
					},
				],
			},
		],
	},
	// eslint-disable-next-line @typescript-eslint/ban-ts-commenta
	// @ts-ignore - unused bot parameter
	run: async (bot, interaction, args) => {
		if (interaction.options.getSubcommand() === "hypixelranks") {
			await interaction.reply("Uploading emojis...");

			const emojiBuffers = await getEmojiBuffers();
			for (const [name, buffer] of Object.entries(emojiBuffers)) {
				await interaction.guild!.emojis.create(buffer, name);
			}

			// TODO: Store emoji ID's (and server ID) for later use

			const embed = new MessageEmbed()
				.setColor("GREEN")
				.setTitle("Completed")
				.setDescription("All Hypixel rank emojis have been uploaded!");

			await interaction.followUp({ embeds: [embed] });
		} else {
			const color = args[0] as typeof guildRankColors[keyof typeof guildRankColors];
			const name = args[1] as string;

			const data = `${color}[${name}]`;
			const fakeChat = await fetchFakeChat(data);

			if (isFetchError(fakeChat)) {
				const embed = fetchErrorEmbed(fakeChat);
				return await interaction.reply({ embeds: [embed] });
			}

			// TODO: Slice image into sections... jimp? (Start from right of image, or use remainder of [image / width] for first slice.)
			// TODO: Find a way to save and use emojis when they appear in chat. Use regex to reference by lowercase name to JSON file?
			const emoji = await interaction.guild!.emojis.create(fakeChat, name);
			const embed = new MessageEmbed()
				.setColor("GREEN")
				.setTitle("Emoji set")
				.setDescription(`The emoji ${name} has been created! ${emoji}`);

			await interaction.reply({ embeds: [embed] });
		}
	},
} as Command;
