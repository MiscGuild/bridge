import { Event } from "../../../interfaces/Event";
import fetchHypixelPlayerProfile from "../../../util/requests/fetchHypixelPlayerProfile";
import fetchMojangProfile from "../../../util/requests/fetchMojangProfile";
import isFetchError from "../../../util/requests/isFetchError";
import isUserBlacklisted from "../../../util/isUserBlacklisted";

export default {
	name: "chat:joinRequest",
	runOnce: false,
	run: async (bot, playerName: string) => {
		const mojangProfile = await fetchMojangProfile(playerName);
		if (isFetchError(mojangProfile)) return;

		const playerProfile = await fetchHypixelPlayerProfile(playerName);
		if (!isFetchError(playerProfile)) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const networkLevel = Math.sqrt(2 * playerProfile.networkExp! + 30625) / 50 - 2.5;

			if (networkLevel < parseFloat(process.env.MINIMUM_NETWORK_LEVEL)) {
				bot.sendGuildMessage(
					"oc",
					`The player ${playerName} is not network level ${process.env.MINIMUM_NETWORK_LEVEL}!`,
				);
			}
		}

		if (isUserBlacklisted(mojangProfile.id)) {
			bot.sendGuildMessage("oc", `The player ${playerName} is blacklisted. Do NOT accept their join request.`);
		}
	},
} as Event;
