/**
 * Centralized Hypixel chat regex patterns.
 * Each pattern returns named capture groups via exec/match.
 */

export const patterns = {
    /** Guild or Officer chat message */
    guildChat: /^(Guild|Officer) > (\[.*?])?\s*(\w{2,17}).*?(\[.{1,15}])?: (.*)$/,

    /** Guild message blocked by Hypixel */
    commentBlocked:
        /^We blocked your comment "(.+)" as it is breaking our rules because (.+)\. https:\/\/www\.hypixel\.net\/rules\/$/,

    /** Guild levelled up */
    guildLevelUp: /^\s{19}The Guild has reached Level (\d+)!$/,

    /** Member muted or unmuted */
    guildMuteUnmute:
        /^(\[.*?])?\s*(\w{2,17}) has (muted|unmuted) (\[.*?])?\s*(\w{2,17})(?: for (\d+[a-z]))?$/,

    /** Player joined or left Hypixel */
    joinLeave: /^Guild > (\w{2,17}).*? (joined|left)\.$/,

    /** Bot is in Limbo */
    joinLimbo: /^You were spawned in Limbo\.$/,

    /** Bot entered a lobby (not Limbo) */
    lobbyJoin:
        /^(?:\s>>>\s)?\[.*?]\s[\w]{2,17} (?:joined|spooked into|slid into) the lobby!(?:\s<<<)?$/,

    /** Player requested to join the guild */
    joinRequest: /^(?:\[.*?])?\s*(\w{2,17}) has requested to join the Guild!$/,

    /** /g online response line */
    memberCount: /^(Online|Total) Members: (\d+)$/,

    /** Player joined or left the guild */
    memberJoinLeave: /^(\[.*?])?\s*(\w{2,17}).*? (joined|left) the guild!$/,

    /** Player was kicked from the guild */
    memberKick:
        /^(\[.*?])?\s*(\w{2,17}).*? was kicked from the guild by (\[.*?])?\s*(\w{2,17}).*?!$/,

    /** Player invited someone to the guild */
    guildInvite:
        /^(\[.*?])?\s*(\w{2,17}).*? invited (\[.*?])?\s*(\w{2,17}).*? to the guild!$/,

    /** Player was promoted or demoted */
    promoteDemote: /^(\[.*?])?\s*(\w{2,17}).*? was (promoted|demoted) from (.*) to (.*)$/,

    /** All guild quest tiers complete */
    questComplete: /^\s{17}GUILD QUEST COMPLETED!$/,

    /** A guild quest tier complete */
    questTierComplete: /^\s{17}GUILD QUEST TIER (\d+) COMPLETED!$/,

    /** Same message twice error */
    sameMessageTwice: /^You cannot say the same message twice!$/,

    /** Private message (whisper) */
    whisper: /^From (?:\[.*?])?\s*(\w{2,17}).*?: (.+)$/,
} as const;

export type PatternName = keyof typeof patterns;

export interface ParsedGuildChat {
    type: 'guildChat';
    channel: 'Guild' | 'Officer';
    rank?: string;
    playerName: string;
    guildRank?: string;
    message: string;
}
export interface ParsedJoinLeave {
    type: 'joinLeave';
    playerName: string;
    status: 'joined' | 'left';
}
export interface ParsedMemberJoinLeave {
    type: 'memberJoinLeave';
    rank?: string;
    playerName: string;
    status: 'joined' | 'left';
}
export interface ParsedMemberKick {
    type: 'memberKick';
    rank?: string;
    playerName: string;
    kickerRank?: string;
    kickerName: string;
}
export interface ParsedGuildInvite {
    type: 'guildInvite';
    inviterRank?: string;
    inviterName: string;
    inviteeRank?: string;
    inviteeName: string;
}
export interface ParsedPromoteDemote {
    type: 'promoteDemote';
    rank?: string;
    playerName: string;
    action: 'promoted' | 'demoted';
    fromRank: string;
    toRank: string;
}
export interface ParsedMuteUnmute {
    type: 'guildMuteUnmute';
    muterRank?: string;
    muterName: string;
    action: 'muted' | 'unmuted';
    targetRank?: string;
    targetName: string;
    duration?: string;
}
export interface ParsedWhisper {
    type: 'whisper';
    playerName: string;
    message: string;
}
export interface ParsedMemberCount {
    type: 'memberCount';
    countType: 'Online' | 'Total';
    count: number;
}
export interface ParsedJoinRequest {
    type: 'joinRequest';
    playerName: string;
}
export interface ParsedGuildLevelUp {
    type: 'guildLevelUp';
    level: number;
}
export interface ParsedSimple {
    type:
        | 'commentBlocked'
        | 'joinLimbo'
        | 'lobbyJoin'
        | 'questComplete'
        | 'questTierComplete'
        | 'sameMessageTwice';
    raw: string;
}

export type ParsedChatEvent =
    | ParsedGuildChat
    | ParsedJoinLeave
    | ParsedMemberJoinLeave
    | ParsedMemberKick
    | ParsedGuildInvite
    | ParsedPromoteDemote
    | ParsedMuteUnmute
    | ParsedWhisper
    | ParsedMemberCount
    | ParsedJoinRequest
    | ParsedGuildLevelUp
    | ParsedSimple;

export function parseChatMessage(message: string): ParsedChatEvent | null {
    let m: RegExpMatchArray | null;

    if ((m = message.match(patterns.guildChat))) {
        return {
            type: 'guildChat',
            channel: m[1] as 'Guild' | 'Officer',
            rank: m[2]?.trim() || undefined,
            playerName: m[3]!,
            guildRank: m[4]?.trim() || undefined,
            message: m[5]!,
        };
    }
    if ((m = message.match(patterns.joinLeave))) {
        return { type: 'joinLeave', playerName: m[1]!, status: m[2] as 'joined' | 'left' };
    }
    if ((m = message.match(patterns.memberJoinLeave))) {
        return {
            type: 'memberJoinLeave',
            rank: m[1]?.trim() || undefined,
            playerName: m[2]!,
            status: m[3] as 'joined' | 'left',
        };
    }
    if ((m = message.match(patterns.memberKick))) {
        return {
            type: 'memberKick',
            rank: m[1]?.trim() || undefined,
            playerName: m[2]!,
            kickerRank: m[3]?.trim() || undefined,
            kickerName: m[4]!,
        };
    }
    if ((m = message.match(patterns.guildInvite))) {
        return {
            type: 'guildInvite',
            inviterRank: m[1]?.trim() || undefined,
            inviterName: m[2]!,
            inviteeRank: m[3]?.trim() || undefined,
            inviteeName: m[4]!,
        };
    }
    if ((m = message.match(patterns.promoteDemote))) {
        return {
            type: 'promoteDemote',
            rank: m[1]?.trim() || undefined,
            playerName: m[2]!,
            action: m[3] as 'promoted' | 'demoted',
            fromRank: m[4]!,
            toRank: m[5]!,
        };
    }
    if ((m = message.match(patterns.guildMuteUnmute))) {
        return {
            type: 'guildMuteUnmute',
            muterRank: m[1]?.trim() || undefined,
            muterName: m[2]!,
            action: m[3] as 'muted' | 'unmuted',
            targetRank: m[4]?.trim() || undefined,
            targetName: m[5]!,
            duration: m[6] || undefined,
        };
    }
    if ((m = message.match(patterns.whisper))) {
        return { type: 'whisper', playerName: m[1]!, message: m[2]! };
    }
    if ((m = message.match(patterns.memberCount))) {
        return { type: 'memberCount', countType: m[1] as 'Online' | 'Total', count: Number(m[2]) };
    }
    if ((m = message.match(patterns.joinRequest))) {
        return { type: 'joinRequest', playerName: m[1]! };
    }
    if ((m = message.match(patterns.guildLevelUp))) {
        return { type: 'guildLevelUp', level: Number(m[1]) };
    }
    if (patterns.joinLimbo.test(message)) return { type: 'joinLimbo', raw: message };
    if (patterns.lobbyJoin.test(message)) return { type: 'lobbyJoin', raw: message };
    if (patterns.questComplete.test(message)) return { type: 'questComplete', raw: message };
    if ((m = message.match(patterns.questTierComplete)))
        return { type: 'questTierComplete', raw: message };
    if (patterns.sameMessageTwice.test(message)) return { type: 'sameMessageTwice', raw: message };
    if (patterns.commentBlocked.test(message)) return { type: 'commentBlocked', raw: message };

    return null;
}
