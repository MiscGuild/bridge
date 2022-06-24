export default {
	/**
	 * When a message is sent in the guild chat
	 *
	 * Returns:
	 *  - Channel (Guild / Officer)
	 *  - Hypixel Rank
	 *  - Player Name
	 *  - Guild Rank
	 *  - Message
	 */
	"chat:guildChat": /^(Guild|Officer) > (\[.*]\s*)?(\w{2,17}).*?(\[.{1,15}])?: (.*)$/,

	/**
	 * When a member connects to or disconnects from Hypixel
	 *
	 * Returns:
	 *  - Player Name
	 *  - joined / left
	 */
	"chat:joinLeave": /^Guild > (\w{2,17}).*? (joined|left)\.$/,

	/**
	 * When "/g online" is typed, and the online and total member count is shown
	 *
	 * Returns:
	 *  - Online / Total
	 *  - Member Count
	 */
	"chat:memberCount": /^(Online|Total) Members: (\d+)$/,

	/**
	 * When "/g online" is typed, and list of members is shown
	 *
	 * Returns:
	 *  - Online Members
	 */
	"chat:blacklistCheck": /(?:\[.*?]\s*)?(\w{2,17}) ● {2}/,

	/**
	 * When a player joins the guild
	 *
	 * Returns:
	 *  - Hypixel Rank
	 *  - Player Name
	 */
	"chat:memberJoin": /^(\[.*]\s*)?(\w{2,17}).*? joined the guild!$/,

	/**
	 * When a player leaves the guild
	 *
	 * Returns:
	 *  - Hypixel Rank
	 *  - Player Name
	 */
	"chat:memberLeave": /^(\[.*]\s*)?(\w{2,17}).*? left the guild!$/,

	/**
	 * When a player is kicked from the guild
	 *
	 * Returns:
	 *  - Hypixel Rank
	 *  - Player Name
	 *  - Kicker Hypixel Rank
	 *  - Kicker Player Name
	 */
	"chat:memberKicked": /^(\[.*]\s*)?(\w{2,17}).*? was kicked from the guild by (\[.*]\s*)?(\w{2,17}).*?!$/,

	/**
	 * When a member is promoted or demoted
	 *
	 * Returns:
	 *  - Hypixel Rank
	 *  - Player Name
	 *  - Promoted / demoted
	 *  - From Rank
	 *  - To Rank
	 */
	"chat:promotedDemoted": /^(\[.*]\s*)?(\w{2,17}).*? was (promoted|demoted) from (.*) to (.*)$/,

	/**
	 * When the guild levels up
	 *
	 * Returns:
	 *  - New Guild Level
	 */
	"chat:guildLevelUp": /^\s{19}The Guild has reached Level (\d*)!$/,

	/**
	 * When a guild quest tier is complete
	 *
	 * Returns:
	 *  - Tier Completed
	 */
	"chat:questTierComplete": /^\s{17}GUILD QUEST TIER (\d*) COMPLETED!$/,

	/**
	 * When all guild quest tiers are complete
	 */
	"chat:questComplete": /^\s{17}GUILD QUEST COMPLETED!$/,

	/**
	 * When the bot detects its not in Limbo
	 */
	"chat:lobbyJoin":
		/^(?:\s>>>\s)?\[.*]\s[\w]{2,17} (?:joined the lobby!|spooked into the lobby!|slid into the lobby!)(?:\s<<<)?$/,

	/**
	 * When the bot detects it is in Limbo
	 */
	"chat:limboJoin": /^You were spawned in Limbo.$/,

	/**
	 * When a message is blocked for containing suspicious content
	 *
	 * Returns:
	 *  - Comment blocked
	 *  - Reason
	 */
	"chat:commentBlocked":
		/^We blocked your comment "(.+)" as it is breaking our rules because (.+). https:\/\/www.hypixel.net\/rules\/$/,

	/**
	 * When a message is sent repeatedly
	 */
	"chat:sameMessageTwice": /^You cannot say the same message twice!$/,

	/**
	 * When a player whispers to the bot with "/msg"
	 *
	 * Returns:
	 *  - Hypixel Rank
	 *  - Player Name
	 *  - Message
	 */
	"chat:whisper": /^From (?:\[.*]\s*)?(\w{2,17}).*?: (.+)$/,

	/**
	 * When a player requests to join the guild
	 *
	 * Returns:
	 *  - Player Name
	 */
	"chat:joinRequest": /^(?:\[.*]\s*)?(\w{2,17}) has requested to join the Guild!$/,
};
