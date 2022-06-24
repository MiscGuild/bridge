import { BlacklistEntry } from "../../../interfaces/BlacklistEntry";
import { Event } from "../../../interfaces/Event";
import fetchMojangProfile from "../../../util/fetchMojangProfile";
import isFetchError from "../../../util/isFetchError";
import _blacklist from "../../../util/_blacklist.json";

export default {
	name: "chat:joinRequest",
	runOnce: false,
	run: async (bot, playerName) => {
		const blacklist = _blacklist as BlacklistEntry[];
		const mojangProfile = await fetchMojangProfile(playerName);

		if (!isFetchError(mojangProfile)) {
			if (blacklist.some((entry) => entry.uuid === mojangProfile.id)) {
				await bot.sendGuildMessage(
					"oc",
					`The player ${playerName} is blacklisted. Do NOT accept their join request.`,
				);
			}
		}

		// TODO: Do not accept network levels? (set in .env)
	},
} as Event;
