import { BlacklistEntry } from "../../../interfaces/BlacklistEntry";
import { Event } from "../../../interfaces/Event";
import _blacklist from "../../../util/_blacklist.json";
import fetchMojangProfile from "../../../util/fetchMojangProfile";
import isFetchError from "../../../util/isFetchError";

export default {
	name: "chat:blacklistCheck",
	runOnce: false,
	run: async (bot, members: string[]) => {
		const blacklist = _blacklist as BlacklistEntry[];

		for (const member of members) {
			const mojangProfile = await fetchMojangProfile(member);

			if (!isFetchError(mojangProfile)) {
				if (blacklist.some((entry) => entry.uuid === mojangProfile.id)) {
					bot.executeCommand(
						`/g kick ${member} You have been blacklisted from the guild. Mistake? --> ${process.env.DISCORD_INVITE_LINK}`,
					);
				}
			}
		}
	},
} as Event;
