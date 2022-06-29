import { MessageEmbed } from "discord.js";
import { Command } from "../interfaces/DiscordCommand";
import fetchErrorEmbed from "../util/fetchErrorEmbed";
import fetchFakeChat from "../util/fetchFakeChat";
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
			{
				name: "server",
				description: "What is the ID of the server you wish to upload the emoji to?",
				type: "STRING",
				required: true,
			},
		],
	},
	run: async (bot, interaction, args) => {
		const color = args[0] as typeof guildRankColors[keyof typeof guildRankColors];
		const name = args[1] as string;
		const serverId = args[2] as string;

		const data = `${color}[${name}]`;
		const fakeChat = await fetchFakeChat(data);

		if (isFetchError(fakeChat)) {
			const embed = fetchErrorEmbed(fakeChat);
			return interaction.reply({ embeds: [embed] });
		}

		const server = await bot.discord.guilds.fetch(serverId);
		if (!server) {
			const embed = new MessageEmbed()
				.setColor("RED")
				.setTitle("Error")
				.setDescription(
					"The bot was unable to find a server with the given id. (Check the id/bot is a member of the server)",
				);
			return interaction.reply({ embeds: [embed] });
		}

		// TODO: Slice image into sections... jimp? (Start from right of image, or use remainder of [image / width] for first slice.)
		// TODO: Find a way to save and use emojis when they appear in chat. Use regex to reference by lowercase name to JSON file?
		const emoji = await server.emojis.create(fakeChat, name);
		const embed = new MessageEmbed()
			.setColor("GREEN")
			.setTitle("Emoji set")
			.setDescription(`The emoji ${name} has been created! ${emoji}`);

		interaction.reply({ embeds: [embed] });
	},
} as Command;
