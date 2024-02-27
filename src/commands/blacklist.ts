import { ApplicationCommandOptionType, EmbedBuilder, TextChannel } from "discord.js";
import { BlacklistEntry } from "../interfaces/BlacklistEntry";
import { Command } from "../interfaces/Command";
import _blacklist from "../util/_blacklist.json";
import fetchErrorEmbed from "../util/requests/fetchErrorEmbed";
import fetchMojangProfile from "../util/requests/fetchMojangProfile";
import isFetchError from "../util/requests/isFetchError";
import writeToJsonFile from "../util/writeToJsonFile";

export default {
	data: {
		name: "blacklist",
		description: "Add or remove a user from the blacklist!",
		options: [
			{
				name: "add",
				description: "Add a user to the blacklist",
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: "user",
						description: "The user to add to the blacklist",
						type: ApplicationCommandOptionType.String,
						required: true,
					},
					{
						name: "end",
						description: "The end date of the blacklist",
						type: ApplicationCommandOptionType.String,
						required: true,
					},
					{
						name: "reason",
						description: "The reason for the blacklist",
						type: ApplicationCommandOptionType.String,
						required: true,
					},
				],
			},
			{
				name: "remove",
				description: "Removes a user from the blacklist",
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: "user",
						description: "The user to remove from the blacklist",
						type: ApplicationCommandOptionType.String,
						required: true,
					},
				],
			},
		],
	},
	run: async (bot, interaction, args) => {
		const type = interaction.options.getSubcommand() as "add" | "remove";
		const mojangProfile = await fetchMojangProfile(args[0]);
		const blacklist = _blacklist as BlacklistEntry[];

		if (isFetchError(mojangProfile)) {
			const embed = fetchErrorEmbed(mojangProfile);
			await interaction.reply({ embeds: [embed] });
			return;
		}

		const isOnBlacklist = blacklist.some((user) => user.uuid === mojangProfile.id);
		if ((type === "add" && isOnBlacklist) || (type === "remove" && !isOnBlacklist)) {
			const embed = new EmbedBuilder()
				.setColor("Red")
				.setTitle("Error")
				.setDescription(`That user is ${type === "add" ? "already" : "not"} on the blacklist!`);

			await interaction.reply({ embeds: [embed] });
			return;
		}

		if (type === "add") {
			const endDate = args[1];
			const reason = args[2];
			const embed = new EmbedBuilder()
				.setAuthor({
					name: "Blacklist",
					iconURL: "https://media.discordapp.net/attachments/522930879413092388/849317688517853294/misc.png",
				})
				.setColor("Red")
				.setFooter({ text: `UUID: ${mojangProfile.id}` })
				.setThumbnail(`https://visage.surgeplay.com/full/${mojangProfile.id}.png`)
				.setTimestamp()
				.setTitle(mojangProfile.name)
				.setURL(`http://plancke.io/hypixel/player/stats/${mojangProfile.id}`)
				.addFields([
					{ name: "End:", value: endDate },
					{ name: "Reason:", value: reason },
				]);

			const blacklistMessage = await (
				(await bot.discord.channels.fetch(process.env.BLACKLIST_CHANNEL_ID)) as TextChannel
			).send({
				embeds: [embed],
			});

			blacklist.push({
				name: mojangProfile.name,
				uuid: mojangProfile.id,
				endDate: endDate,
				reason: reason,
				messageId: blacklistMessage.id,
			});
		} else {
			const blacklistEntry = blacklist.find((user) => user.uuid === mojangProfile.id) as BlacklistEntry;
			blacklist.splice(blacklist.indexOf(blacklistEntry));

			const message = await (
				bot.discord.channels.cache.get(process.env.BLACKLIST_CHANNEL_ID) as TextChannel
			).messages.fetch(blacklistEntry.messageId);
			await message.delete();
		}

		const successEmbed = new EmbedBuilder()
			.setColor(type === "add" ? "Red" : "Green")
			.setThumbnail(`https://crafatar.com/avatars/${mojangProfile.id}`)
			.setTitle("Completed!")
			.setDescription(`${mojangProfile.name} was ${type === "add" ? "added to" : "removed from"} the blacklist!`);

		writeToJsonFile("./src/util/_blacklist.json", blacklist, interaction, successEmbed);
	},
	staffOnly: true,
} as Command;
