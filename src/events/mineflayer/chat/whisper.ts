import { Event } from "../../../interfaces/Event";
import fetchHypixelPlayerProfile from "../../../util/fetchHypixelPlayerProfile";
import fetchMojangProfile from "../../../util/fetchMojangProfile";
import isFetchError from "../../../util/isFetchError";

export default {
	name: "chat:whisper",
	runOnce: false,
	run: async (bot, playerName: string, message: string) => {
		const target = message.startsWith("weeklygexp" || "weeklygxp") ? playerName : (message.split(" ")[0] as string);
		const mojangProfile = await fetchMojangProfile(target);
		const hypixelPlayerProfile = await fetchHypixelPlayerProfile(target);

		if (isFetchError(mojangProfile) || isFetchError(hypixelPlayerProfile)) {
			bot.executeCommand(
				`/w ${playerName} There was an error attempting your request! (Check spelling and/or try again later)`,
			);
		} else {
			const member = hypixelPlayerProfile.members.find((guildMember) => guildMember.uuid === mojangProfile.id);

			bot.executeCommand(
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				`/w ${playerName} ${target}'s total weekly gexp: ${Object.values(member!.expHistory).reduce(
					(previous, current) => previous + current,
				)}`,
			);
		}
	},
} as Event;
