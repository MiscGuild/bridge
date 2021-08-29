const regexes = {}

// --On /g online
regexes.guildOnline = /^Online Members: (\d{1,3})/;

// --Blacklist check
regexes.blacklistCheck = /(^(?:(?:\[.+?\])? ?(?:[A-Za-z0-9_]{3,16}) ●  )+)/;

// --On guild chat
regexes.guildChat =  /^Guild > (\[.+?\])? ?([A-Za-z0-9_]{3,16}) (\[.+\]): (.+)/;

// --On officer chat
regexes.officerChat = /^Officer > (\[.+?\])? ?([A-Za-z0-9_]{3,16}) (\[.+\]): (.+)/;

// --On guild kick
regexes.guildKick = /^(\[.+?\])? ?([A-Za-z0-9_]{3,16}) was kicked from the guild by (\[.+?\])? ?([A-Za-z0-9_]{3,16})!/;

// --On member join guild
regexes.guildJoin = /^(\[.+?\])? ?([A-Za-z0-9_]{3,16}) joined the guild!/;

// --On member leave guild
regexes.guildLeave = /^(\[.+?\])? ?([A-Za-z0-9_]{3,16}) left the guild!/;

// --On guild promotion
regexes.guildPromote = /(\[.+?\])? ?([A-Za-z0-9_]{3,16}) was promoted from (.+) to (.+)/;

// --On guild demotion
regexes.guildDemote = /(\[.+?\])? ?([A-Za-z0-9_]{3,16}) was demoted from (.+) to (.+)/;

// --Cannot say same message twice
regexes.cannotSaySameMessageTwice = /^You cannot say the same message twice!/;

// --On Hypixel comment block
regexes.commentBlocked = /^We blocked your comment "(.+)" as it is breaking our rules because (.+)/;

// --On gulid join request
regexes.guildRequesting = /(\[.+?\])? ?([A-Za-z0-9_]{3,16}) has requested to join the Guild!/;

// --On member leave game
regexes.guildLeftGame = /^Guild > ([A-Za-z0-9_]{3,16}) left\./;

// --On member join game
regexes.guildJoinedGame = /^Guild > ([A-Za-z0-9_]{3,16}) joined\./;

// --On guild mute
regexes.guildMute =  /^(\[.+?\])? ?([A-Za-z0-9_]{3,16}) has muted (\[.+?\])? ?([A-Za-z0-9_]{3,16}) for (\d*)([a-z])/;

// --On guild unmute
regexes.guildUnmute = /^(\[.+?\])? ?([A-Za-z0-9_]{3,16}) has unmuted (\[.+?\])? ?([A-Za-z0-9_]{3,16})/;

// --On /msg bot
regexes.msgBot = /^From (?:\[.+?\])? ?([A-Za-z0-9_]{3,16}): (.+)/;

module.exports = regexes;