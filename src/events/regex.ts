export default {
    /**
     * When a message is blocked for containing suspicious content
     *
     * Returns:
     *  - Comment blocked
     *  - Reason
     */
    'chat:commentBlocked':
        /^We blocked your comment "(.+)" as it is breaking our rules because (.+). https:\/\/www.hypixel.net\/rules\/$/,

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
    'chat:guildChat': /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?: (.*)$/,

    /**
     * When the guild levels up
     *
     * Returns:
     *  - New Guild Level
     */
    'chat:guildLevelUp': /^\s{19}The Guild has reached Level (\d*)!$/,

    /**
     * When a member is muted/unmuted
     *
     * Returns:
     *  - Hypixel Rank
     *  - Player Name
     *  - muted / unmuted
     *  - Muter Hypixel Rank
     *  - Muter Player Name
     *  - Muter Player Name
     *  - Duration
     */
    'chat:guildMuteUnmute':
        /^(\[.*])?\s*(\w{2,17}) has (muted|unmuted) (\[.*])?\s*(\w{2,17})(?: for (\d*[a-z]))?$/,

    /**
     * When a member connects to or disconnects from Hypixel
     *
     * Returns:
     *  - Player Name
     *  - joined / left
     */
    'chat:joinLeave': /^Guild > (\w{2,17}).*? (joined|left)\.$/,

    /**
     * When the bot detects it is in Limbo
     */
    'chat:joinLimbo': /^You were spawned in Limbo.$/,

    /**
     * When the bot detects it's not in Limbo
     */
    'chat:lobbyJoin':
        /^(?:\s>>>\s)?\[.*]\s[\w]{2,17} (?:joined|spooked into|slid into) the lobby!(?:\s<<<)?$/,

    /**
     * When a player requests to join the guild
     *
     * Returns:
     *  - Player Name
     */
    'chat:joinRequest': /^(?:\[.*])?\s*(\w{2,17}) has requested to join the Guild!$/,

    /**
     * When "/g online" is typed, and the online and total member count is shown
     *
     * Returns:
     *  - Online / Total
     *  - Member Count
     */
    'chat:memberCount': /^(Online|Total) Members: (\d+)$/,

    /**
     * When a player joins or leaves the guild
     *
     * Returns:
     *  - Hypixel Rank
     *  - Player Name
     *  - joined / left
     */
    'chat:memberJoinLeave': /^(\[.*])?\s*(\w{2,17}).*? (joined|left) the guild!$/,

    /**
     * When a player is kicked from the guild
     *
     * Returns:
     *  - Hypixel Rank
     *  - Player Name
     *  - Kicker Hypixel Rank
     *  - Kicker Player Name
     */
    'chat:memberKick':
        /^(\[.*])?\s*(\w{2,17}).*? was kicked from the guild by (\[.*])?\s*(\w{2,17}).*?!$/,

    /**
     * When a member is promoted or demoted
     *
     * Returns:
     *  - Hypixel Rank
     *  - Player Name
     *  - promoted / demoted
     *  - From Rank
     *  - To Rank
     */
    'chat:promoteDemote': /^(\[.*])?\s*(\w{2,17}).*? was (promoted|demoted) from (.*) to (.*)$/,

    /**
     * When all guild quest tiers are complete
     */
    'chat:questComplete': /^\s{17}GUILD QUEST COMPLETED!$/,

    /**
     * When a guild quest tier is complete
     *
     * Returns:
     *  - Tier Completed
     */
    'chat:questTierComplete': /^\s{17}GUILD QUEST TIER (\d*) COMPLETED!$/,

    /**
     * When a message is sent repeatedly
     */
    'chat:sameMessageTwice': /^You cannot say the same message twice!$/,

    /**
     * When a player whispers to the bot with "/msg"
     *
     * Returns:
     *  - Hypixel Rank
     *  - Player Name
     *  - Message
     */
    'chat:whisper': /^From (?:\[.*])?\s*(\w{2,17}).*?: (.+)$/,

    /**
     *
     * For logging guild logs
     *
     * Returns:
     * - Date
     * - Time
     * - Timezone
     * - Username
     * - Action
     * - Optional Space
     * - Optional "to"
     * - Optional Second Username
     * - Optional Additional Info
     *
     */
    'chat:guildLogHeader': /Guild Log \(Page \d+ of \d+\) >>$/,
    'chat:guildLog1':
        /(([A-Za-z]{3}\s[0-9]{1,2}\s[0-9]{4}) (([0-9]{2}):([0-9]{2})) ((EDT|EST))): ([A-Za-z-0-9-_]{2,27}) (joined|left|invited|kicked|muted|unmuted|set rank of|set MOTD|set guild tag|set guild tagcolor|set Discord|turned the chat throttle on|turned the chat throttle off)( ([A-Za-z-0-9-_]{2,27})?)?( for | to |: )?([ A-Za-z-0-9-!-_\\s]+)?/g,
    'chat:guildLog':
        /([A-Za-z]{3}\s[0-9]{1,2}\s[0-9]{4})\s(([0-9]{2}):([0-9]{2}))\s(EDT|EST):\s([A-Za-z0-9-_]{2,27})\s(joined|left|invited|kicked|muted|unmuted|set rank of|set MOTD|set guild tag|set guild tagcolor|set Discord|turned the chat throttle on|turned the chat throttle off)(\s([A-Za-z0-9-_]{2,27}))?( for | to |: )?([ A-Za-z0-9-!_\\s]+)?/gm,

    /**
     *
     * For check if a player has said !bw [ign] (ign is optional) in chat
     *
     *
     */
    'chat:bw-stats':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?:\s!bw\s?(\w{2,17})?.*$/,

    /**
     *
     * For check if a player has said !sw [ign] (ign is optional) in chat
     *
     *
     */

    'chat:sw-stats':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?:\s!sw\s?(\w{2,17})?.*$/,

    /**
     *
     * For check if a player has said !cvc [ign] (ign is optional) in chat
     *
     *
     */
    'chat:cvc-stats-overall':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?:\s!cvc\soverall\s?(\w{2,17})?.*$/,
    'chat:cvc-stats-defusal':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?:\s!cvc\sdefusal\s?(\w{2,17})?.*$/,
    'chat:cvc-stats-tdm':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?:\s!cvc\stdm\s?(\w{2,17})?.*$/,

    /**
     *
     * For check if a player has said !mm [ign] (ign is optional) in chat
     *
     *
     */

    'chat:mm-stats':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?:\s!mm\s?(\w{2,17})?.*$/,

    /**
     *
     * For check if a player has said !duels [gamemode] [ign] (ign is optional) in chat
     *
     *
     *
     */

    'chat:duels-overall':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?: (.*)!duels\s(overall|o)\s?(\w{2,17})?.*$/,

    'chat:duels-bridge':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?: (.*)!duels\sbridge\s?(\w{2,17})?.*$/,

    'chat:duels-classic':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?: (.*)!duels\s(classic|c)\s?(\w{2,17})?.*$/,
    'chat:duels-uhc':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?: (.*)!duels\suhc\s?(\w{2,17})?.*$/,
    'chat:duels-op':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?: (.*)!duels\sop\s?(\w{2,17})?.*$/,
    'chat:duels-sumo':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?: (.*)!duels\s(sumo|sum|sumoo|s|sm)\s?(\w{2,17})?.*$/,
    'chat:duels-blitz':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?: (.*)!duels\s(blitz|blits)\s?(\w{2,17})?.*$/,
    'chat:duels-sw':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?: (.*)!duels\s(sw|skywars)\s?(\w{2,17})?.*$/,
    'chat:duels-combo':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?: (.*)!duels\s(combo|comb)\s?(\w{2,17})?.*$/,

    /**
     *
     * To check if the message is duplicated
     */

    'chat:duplicateMessage': /^You cannot say the same message twice!$/,

    /**
     *
     * To check if the player has said !gexp [ign] in chat
     *
     *
     */
    'chat:gexp-stats':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?: (.*)!gexp\s?(\w{2,17})?.*$/,

    /**
     * Global regex for all commands
     *
     * Returns:
     * *  - Command
     * *  - GameMode
     * *  - Player Name
     *
     *
     */

    'chat:command':
        /^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?: (.*)!([a-z]{2,4})\s?([a-z]{2,17})?.*$/,
};
