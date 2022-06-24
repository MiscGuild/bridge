import { BlacklistEntry } from "../../../interfaces/BlacklistEntry";
import { Event } from "../../../interfaces/Event";
import _blacklist from "../../../util/_blacklist.json";
import fetchHypixelPlayerProfile from "../../../util/fetchHypixelPlayerProfile";
import fetchMojangProfile from "../../../util/fetchMojangProfile";
import isFetchError from "../../../util/isFetchError";

export default {
	name: "chat:joinRequest",
	runOnce: false,
	run: async (bot, playerName: string) => {
		const blacklist = _blacklist as BlacklistEntry[];
		const mojangProfile = await fetchMojangProfile(playerName);

		if (!isFetchError(mojangProfile)) {
			const playerProfile = await fetchHypixelPlayerProfile(playerName);

			if (!isFetchError(playerProfile)) {
				const networkLevel = Math.sqrt(2 * playerProfile.networkExp! + 30625) / 50 - 2.5;

				if (networkLevel < parseFloat(process.env.MINIMUM_NETWORK_LEVEL as string)) {
					await bot.sendGuildMessage(
						"oc",
						`The player ${playerName} is not network level ${process.env.MINIMUM_NETWORK_LEVEL}!`,
					);
				}
			}

			if (blacklist.some((entry) => entry.uuid === mojangProfile.id)) {
				await bot.sendGuildMessage(
					"oc",
					`The player ${playerName} is blacklisted. Do NOT accept their join request.`,
				);
			}
		}
	},
} as Event;
