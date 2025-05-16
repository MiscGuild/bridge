/* ---------- shared fragments ------------------------------------------------ */

const RANK = String.raw`(\[.*])?`;
const PLAYER_NAME = String.raw`(\w{2,17})`;
const GUILD_RANK = String.raw`(\[.{1,15}])?`;
const CHANNEL = String.raw`(Guild|Officer)`;

/*  Guild/Officer chat line prefix
 *  1  Channel         (Guild|Officer)
 *  2  Hypixel Rank    (\[.*])?
 *  3  Player Name     (\w{2,17})
 *  4  Guild Rank      (\[.{1,15}])?
 */
const CHAT_PREFIX = String.raw`^${CHANNEL} > ${RANK}\s*${PLAYER_NAME}.*?${GUILD_RANK}:`;


export default {

    'chat:commentBlocked':
        /^We blocked your comment "(.+)" as it is breaking our rules because (.+). https:\/\/www\.hypixel\.net\/rules\/$/,


    'chat:guildChat': new RegExp(`${CHAT_PREFIX} (.*)$`),


    'chat:guildLevelUp': /^\s{19}The Guild has reached Level (\d+)!$/,

    'chat:guildMuteUnmute': new RegExp(
        String.raw`^(\[.*])?\s*(\w{2,17}) has (muted|unmuted) (\[.*])?\s*(\w{2,17})(?: for (\d*[a-z]))?$`
    ),

    'chat:joinLeave': /^Guild > (\w{2,17}).*? (joined|left)\.$/,

    'chat:lobbyJoin':
        /^(?:\s>>>\s)?\[.*]\s\w{2,17}\s(?:joined|spooked into|slid into) the lobby!(?:\s<<<)?$/,

    'chat:joinRequest': /^(?:\[.*])?\s*(\w{2,17}) has requested to join the Guild!$/,

    'chat:memberCount': /^(Online|Total) Members: (\d+)$/,

    'chat:memberJoinLeave': new RegExp(
        String.raw`^${RANK}\s*${PLAYER_NAME}.*?\s(joined|left) the guild!$`
    ),

    'chat:memberKick':
        /^(\[.*])?\s*(\w{2,17}).*? was kicked from the guild by (\[.*])?\s*(\w{2,17}).*?!$/,

    'chat:promoteDemote':
        /^(\[.*])?\s*(\w{2,17}).*? was (promoted|demoted) from (.*) to (.*)$/,

    'chat:questComplete': /^\s{17}GUILD QUEST COMPLETED!$/,

    'chat:questTierComplete': /^\s{17}GUILD QUEST TIER (\d+) COMPLETED!$/,

    'chat:sameMessageTwice': /^You cannot say the same message twice!$/,

    'chat:whisper': /^From (?:\[.*])?\s*(\w{2,17}).*?: (.+)$/,


    'chat:guildLogHeader': /Guild Log \(Page \d+ of \d+\) >>$/,

    'chat:guildLog1':
        /(([A-Za-z]{3}\s[0-9]{1,2}\s[0-9]{4})\s(([0-9]{2}):([0-9]{2}))\s(EDT|EST)):\s([A-Za-z0-9-_]{2,27})\s(joined|left|invited|kicked|muted|unmuted|set rank of|set MOTD|set guild tag|set guild tagcolor|set Discord|turned the chat throttle on|turned the chat throttle off)(\s([A-Za-z0-9-_]{2,27}))?(?:\s(for|to|:)\s([A-Za-z0-9-!_\s]+))?/g,

    'chat:guildLog':
        /([A-Za-z]{3}\s[0-9]{1,2}\s[0-9]{4})\s(([0-9]{2}):([0-9]{2}))\s(EDT|EST):\s([A-Za-z0-9-_]{2,27})\s(joined|left|invited|kicked|muted|unmuted|set rank of|set MOTD|set guild tag|set guild tagcolor|set Discord|turned the chat throttle on|turned the chat throttle off)(\s([A-Za-z0-9-_]{2,27}))?(?:\s(for|to|:)\s([A-Za-z0-9-!_\s]+))?/gm,


    'chat:bw-stats': new RegExp(
        String.raw`${CHAT_PREFIX}\s!bw\s?${PLAYER_NAME}?.*$`
    ),
    'chat:sw-stats': new RegExp(
        String.raw`${CHAT_PREFIX}\s!sw\s?${PLAYER_NAME}?.*$`
    ),

    'chat:cvc-stats-overall': new RegExp(
        String.raw`${CHAT_PREFIX}\s!cvc\soverall\s?${PLAYER_NAME}?.*$`
    ),
    'chat:cvc-stats-defusal': new RegExp(
        String.raw`${CHAT_PREFIX}\s!cvc\sdefusal\s?${PLAYER_NAME}?.*$`
    ),
    'chat:cvc-stats-tdm': new RegExp(
        String.raw`${CHAT_PREFIX}\s!cvc\stdm\s?${PLAYER_NAME}?.*$`
    ),

    'chat:mm-stats': new RegExp(
        String.raw`${CHAT_PREFIX}\s!mm\s?${PLAYER_NAME}?.*$`
    ),


    'chat:duels-overall': new RegExp(
        String.raw`${CHAT_PREFIX}\s!duels\s(overall|o)\s?${PLAYER_NAME}?.*$`
    ),
    'chat:duels-bridge': new RegExp(
        String.raw`${CHAT_PREFIX}\s!duels\sbridge\s?${PLAYER_NAME}?.*$`
    ),
    'chat:duels-classic': new RegExp(
        String.raw`${CHAT_PREFIX}\s!duels\s(classic|c)\s?${PLAYER_NAME}?.*$`
    ),
    'chat:duels-uhc': new RegExp(
        String.raw`${CHAT_PREFIX}\s!duels\suhc\s?${PLAYER_NAME}?.*$`
    ),
    'chat:duels-op': new RegExp(
        String.raw`${CHAT_PREFIX}\s!duels\sop\s?${PLAYER_NAME}?.*$`
    ),
    'chat:duels-sumo': new RegExp(
        String.raw`${CHAT_PREFIX}\s!duels\s(?:sumo|sum|sumoo|s|sm)\s?${PLAYER_NAME}?.*$`
    ),
    'chat:duels-blitz': new RegExp(
        String.raw`${CHAT_PREFIX}\s!duels\s(blitz|blits)\s?${PLAYER_NAME}?.*$`
    ),
    'chat:duels-sw': new RegExp(
        String.raw`${CHAT_PREFIX}\s!duels\s(sw|skywars)\s?${PLAYER_NAME}?.*$`
    ),
    'chat:duels-combo': new RegExp(
        String.raw`${CHAT_PREFIX}\s!duels\s(combo|comb)\s?${PLAYER_NAME}?.*$`
    ),


    'chat:gexp-stats': new RegExp(
        String.raw`${CHAT_PREFIX}\s!gexp\s?${PLAYER_NAME}?.*$`
    ),

    'chat:command': new RegExp(
        String.raw`^(Guild|Officer) > (\[.*])?\s*(\w{2,17}).*?(\[.{1,15}])?:\s!([a-z]{2,4})\s?([a-z]{2,17})?.*$`
    ),


    'chat:duplicateMessage': /^You cannot say the same message twice!$/,

    /**
     * When the bot detects it is in Limbo
     */
    'chat:joinLimbo': /^You were spawned in Limbo.$/,
};
