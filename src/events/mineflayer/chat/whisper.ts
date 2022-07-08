import { Event } from "../../../interfaces/Event";
import fetchHypixelGuild from "../../../util/requests/fetchHypixelGuild";
import fetchMojangProfile from "../../../util/requests/fetchMojangProfile";
import isFetchError from "../../../util/requests/isFetchError";

export default {
	name: "chat:whisper",
	runOnce: false,
	run: async (bot, playerName: string, message: string) => {
		const errorMessage = `/w ${playerName} There was an error attempting your request! (Check spelling and/or try again later)`;
		const target = message.startsWith("weeklygexp" || "weeklygxp") ? playerName : (message.split(" ")[0] as string);
		const mojangProfile = await fetchMojangProfile(target);

		if (isFetchError(mojangProfile)) {
			return bot.executeCommand(errorMessage);
		}

		const playerGuild = await fetchHypixelGuild(mojangProfile.id);
		if (isFetchError(playerGuild)) {
			return bot.executeCommand(errorMessage);
		}

		const member = playerGuild.members.find((guildMember) => guildMember.uuid === mojangProfile.id);
		bot.executeCommand(
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			`/w ${playerName} ${target}'s total weekly gexp: ${Object.values(member!.expHistory).reduce(
				(previous, current) => previous + current,
			)}`,
		);
	},
} as Event;
