import { BlacklistEntry } from "../../../interfaces/BlacklistEntry";
import { Event } from "../../../interfaces/Event";
import _blacklist from "../../../util/_blacklist.json";
import fetchMojangProfile from "../../../util/requests/fetchMojangProfile";
import isFetchError from "../../../util/requests/isFetchError";
import regex from "../../../util/regex";

export default {
	name: "chat:blacklistCheck",
	runOnce: false,
	run: async (bot, ...globalMatches: string[]) => {
		const singleMatchRegex = new RegExp(regex["chat:blacklistCheck"], "");
		const blacklist = _blacklist as BlacklistEntry[];

		for (const globalMatch of globalMatches) {
			const member = (globalMatch.match(singleMatchRegex) as RegExpMatchArray)[1] as string;
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
