import { client } from "../index.js";
import emojis from "../resources/emojis.js";
let firstTime = true;

async function setEmojis() {
	emojis.forEach((emojiID, emojiName) => {
		eval("global." + emojiName + "=" + "client.emojis.cache.get(\"" + emojiID + "\")");
	});
}

export async function getRankEmoji(rank) {
	if (firstTime) {
		firstTime = false;
		await setEmojis();
	}

	const rankData = {
		"": { emojis: "", color: "0xAAAAAA" },
		"[VIP]": { emojis: `\u200D  ${VIP1}${VIP2}${VIP3}`, color: "0x55FF55" },
		"[VIP+]": { emojis: `\u200D     ${VIPPLUS1}${VIPPLUS2}${VIPPLUS3}`, color: "0x55FF55" },
		"[MVP]": { emojis: `\u200D   ${MVP1}${MVP2}${MVP3}`, color: "0x55FFFF" },
		"[MVP+]": { emojis: `${MVPPLUS1}${MVPPLUS2}${MVPPLUS3}${MVPPLUS4}`, color: "0x55FFFF" },
		"[MVP++]": { emojis: `\u200D    ${MVPPLUSPLUS1}${MVPPLUSPLUS2}${MVPPLUSPLUS3}${MVPPLUSPLUS4}`, color: "0xFFAA00" },
	};
	return [rankData[rank].emojis, rankData[rank].color];
}

export async function getTagEmoji(tag) {
	if (firstTime) {
		firstTime = false;
		await setEmojis();
	}
	
	const tagEmojis = {
		"[MISC]": `${MISC1}${MISC2}${MISC3}`,
		"[Active]": `${ACTIVE1}${ACTIVE2}${ACTIVE3}${ACTIVE4}`,
		"[Res]": `${RES1}${RES2}${RES3}`,
		"[Mod]": `${MOD1}${MOD2}${MOD3}`,
		"[Admin]": `${ADMIN1}${ADMIN2}${ADMIN3}${ADMIN4}`,
		"[GM]": `${GM1}${GM2}`,
	};
	return tagEmojis[tag];
}