import { Command } from "../interfaces/DiscordCommand";
import { MessageEmbed, TextChannel } from "discord.js";
import { fetchMojangProfile } from "../util/FetchMojangProfile";
import { isFetchError } from "../util/isFetchError";
import { requestErrorEmbed } from "../util/FetchErrorEmbed";

export default {
	data: {
		name: "blacklist",
		description: "Add or remove a user from the blacklist!",
		options: [
			{
				name: "add",
				description: "Add a user to the blacklist",
				type: "SUB_COMMAND",
				options: [
					{
						name: "user",
						description: "The user to add to the blacklist",
						type: 3,
						required: true,
					},
					{
						name: "end",
						description: "The end date of the blacklist",
						type: 3,
						required: true,
					},
					{
						name: "reason",
						description: "The reason for the blacklist",
						type: 3,
						required: true,
					},
				],
			},
			{
				name: "remove",
				description: "Removes a user from the blacklist",
				type: "SUB_COMMAND",
				options: [
					{
						name: "user",
						description: "The user to remove from the blacklist",
						type: 3,
						required: true,
					},
				],
			},
		],
	},

	run: async (bot, interaction, args) => {
		const type = interaction.options.getSubcommand() as "add" | "remove";
		const mojangProfile = await fetchMojangProfile(args[0]);

		if (isFetchError(mojangProfile)) {
			const embed = requestErrorEmbed(mojangProfile);

			await interaction.reply({ embeds: [embed] });
			return;
		}

		if (type === "add") {
			const end = args[1];
			const reason = args[2];

			// TODO: Adding blacklist logic

			const embed = new MessageEmbed()
				.setAuthor({
					name: "Blacklist",
					iconURL: "https://media.discordapp.net/attachments/522930879413092388/849317688517853294/misc.png",
				})
				.setColor("RED")
				.setFooter({ text: `UUID: ${mojangProfile.id}` })
				.setThumbnail(`https://visage.surgeplay.com/full/${mojangProfile.id}.png`)
				.setTimestamp()
				.setTitle(mojangProfile.name)
				.setURL(`http://plancke.io/hypixel/player/stats/${mojangProfile.id}`)
				.addField("End:", end)
				.addField("Reason:", reason);

			((await bot.discord.channels.fetch(process.env.BLACKLIST_CHANNEL_ID as string)) as TextChannel).send({
				embeds: [embed],
			});
		} else {
			// TODO: Removing blacklist logic
		}

		const embed = new MessageEmbed()
			.setColor(type === "add" ? "RED" : "GREEN")
			.setThumbnail(`https://crafatar.com/avatars/${mojangProfile.id}`)
			.setTitle("Completed!")
			.setDescription(`${mojangProfile.name} was ${type === "add" ? "added to" : "removed from"} the blacklist!`);

		await interaction.reply({ embeds: [embed] });
	},
} as Command;
