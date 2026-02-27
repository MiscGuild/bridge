"use strict";
/**
 * Brainrot Filter Extension
 *
 * Filters "brainrot" slang and memes from guild chat. When a player sends a
 * message that contains blocked terms, the bot can warn, mute, or just log it.
 *
 * Features:
 * - Extensive built-in dictionary of brainrot/slang terms
 * - Configurable action: warn → mute after X warnings, or mute immediately
 * - Warning counter with configurable reset timer
 * - Exempt ranks so staff can bypass the filter
 * - Notify officer chat when a player triggers the filter
 * - Custom allow/block lists in config.json
 * - Case-insensitive matching with word-boundary & leet-speak awareness
 *
 * Configuration (config.json):
 * - enabled: true/false
 * - action: "mute" | "warn" | "log"
 * - muteDuration: Hypixel mute duration string, e.g. "1h", "30m", "1d"
 * - warnBeforeMute: if true, warn players first; mute after maxWarnings
 * - maxWarnings: number of warnings before muting (default 2)
 * - warningResetMinutes: minutes after which warnings reset (default 60)
 * - notifyOfficerChat: send a message to OC when the filter fires
 * - customBlockedTerms: extra terms to block (strings, matched literally)
 * - customAllowedTerms: terms to whitelist (override built-in blocks)
 * - exemptRanks: array of guild rank tags, e.g. ["[GM]", "[Arch]"]
 *
 * @author MiscGuild Bridge Bot Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRAINROT_TERMS = void 0;
exports.containsBrainrot = containsBrainrot;
// ─── Built-in blocked terms ──────────────────────────────────────────────────
// Each entry is turned into a case-insensitive regex with word-boundary logic.
// Grouped by category for maintainability.
exports.BRAINROT_TERMS = [
    // === Core brainrot / TikTok slang ===
    'skibidi',
    'gyatt',
    'gyat',
    'rizz',
    'rizzler',
    'rizzed',
    'rizzing',
    'fanum',
    'fanum tax',
    'sigma',
    'sigma boy',
    'sigma male',
    'sigma grindset',
    'sigmas',
    'ligma',
    'ligma balls',
    // === "Ohio" meme cluster ===
    'only in ohio',
    'ohio ahh',
    'ohio final boss',
    // === Baby Gronk / Livvy Dunne cluster ===
    'baby gronk',
    'livvy dunne',
    'livvy',
    // === "Mewing" / looks-maxxing ===
    'mewing',
    'mew',
    'mogging',
    'mogged',
    'mog',
    'looksmaxxing',
    'looksmax',
    'looksmaxing',
    // === "Aura" / points meme ===
    'aura points',
    '+1000 aura',
    '-1000 aura',
    'negative aura',
    'positive aura',
    // === "Sussy" / Among Us leftovers ===
    'sussy baka',
    'sussy',
    'sus baka',
    'impostor',
    'amogus',
    'mongus',
    'sussy impostor',
    // === "Bussin" / food slang ===
    'bussin',
    'bussing',
    'no cap',
    'on god fr',
    'on god',
    'frfr',
    'fr fr',
    'ong',
    // === "69" / "67" / "420" / immature number memes ===
    '67',
    '6 7',
    '69',
    '6 9',
    '6969',
    '420',
    // === Kai Cenat / streamer brainrot ===
    'kai cenat',
    'duke dennis',
    'speed',
    'ishowspeed',
    // === "Edging" / "gooning" cluster ===
    'edging',
    'edged',
    'gooning',
    'gooner',
    'gooned',
    // === "Hawk tuah" / spit meme ===
    'hawk tuah',
    'hawktuah',
    'hawk tua',
    'tuah',
    // === "Jellybean" / "Jelqing" ===
    'jelqing',
    'jelq',
    // === Italian brainrot cluster ===
    'bombardiro',
    'crocodilo',
    'tralalero',
    'tralala',
    'lirili',
    'larila',
    'bombombini',
    'gusini',
    'brr brr patapim',
    'patapim',
    'tung tung',
    'sahur',
    'cappuccino assassino',
    'assassino',
    'la vaca saturno',
    'saturno',
    'bobritto bandito',
    'bandito',
    'glorbo',
    'frigo camelo',
    'camelo',
    // === Miscellaneous brainrot ===
    'skibidi toilet',
    'griddy',
    'hit the griddy',
    'blud',
    'delulu',
    'its giving',
    "it's giving",
    'slay queen',
    'ate and left no crumbs',
    'understood the assignment',
    'main character',
    'npc',
    'ick',
    'the ick',
    'rent free',
    'caught in 4k',
    'down bad',
    'downbad',
    'brain rot',
    'brainrot',
    'alpha male',
    'alpha wolf',
    'beta male',
    'beta cuck',
    'cuck',
    'simp',
    'simpleton',
    'fanumtax',
    'sticking out your gyatt',
    'bop bop',
    'diddy',
    'diddy party',
    'p diddy',
    'what the sigma',
    'chat is this real',
    'looksmaxxer',
    'bonesmash',
    'bonesmashing',
    // Mean Sentences
    'stfu',
    'ni-',
    'nig',
    'dih',
];
// ─── Standalone brainrot checker (used by Discord message handler) ───────────
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const _brainrotRegex = (() => {
    const sorted = [...exports.BRAINROT_TERMS].sort((a, b) => b.length - a.length);
    const escaped = sorted.map((t) => `\\b${escapeRegex(t)}\\b`);
    return new RegExp(`(?:${escaped.join('|')})`, 'i');
})();
/**
 * Returns the matched brainrot term if the text contains one, or `null` otherwise.
 * Can be imported standalone without instantiating the extension.
 */
function containsBrainrot(text) {
    const normalised = text
        .toLowerCase()
        .replace(/[.,!?;:'"(){}[\]<>]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const match = normalised.match(_brainrotRegex);
    return match ? match[0] : null;
}
// ─── Extension class ─────────────────────────────────────────────────────────
class BrainrotFilterExtension {
    manifest = {
        id: 'brainrot-filter',
        name: 'Brainrot Filter',
        version: '1.0.0',
        description: 'Filters brainrot slang from guild chat',
        author: 'MiscGuild Bridge Bot Team',
    };
    config = {};
    api = null;
    /** username → WarningEntry */
    warnings = new Map();
    /** username → MuteRecord (tracks repeat offences for escalating mutes) */
    muteHistory = new Map();
    /** Pre-compiled regex built from all blocked terms */
    blockedRegex = null;
    /** Set of allowed terms (lowercase) for quick lookup */
    allowedTerms = new Set();
    /** Set of exempt rank tags — built dynamically from RANK_* env vars + config */
    get exemptRanks() {
        const ranks = new Set();
        // Dynamically read exempt ranks from env (RANK_4, RANK_5, RANK_LEADER)
        if (process.env.RANK_4)
            ranks.add(`[${process.env.RANK_4}]`);
        if (process.env.RANK_5)
            ranks.add(`[${process.env.RANK_5}]`);
        if (process.env.RANK_LEADER)
            ranks.add(`[${process.env.RANK_LEADER}]`);
        // Also include any extra ranks from config.json
        if (this.config.exemptRanks) {
            for (const rank of this.config.exemptRanks) {
                ranks.add(rank);
            }
        }
        return ranks;
    }
    cleanupInterval = null;
    /** Index to rotate through warning messages */
    warningMessageIndex = 0;
    /** Pool of varied warning messages to avoid "You cannot say the same message twice!" */
    static WARNING_MESSAGES = [
        '{user}, please avoid using brainrot terms in guild chat. {remaining}',
        "{user}, that language isn't allowed here — keep it clean! {remaining}",
        '{user}, brainrot terms are filtered in this guild. {remaining}',
        "Hey {user}, please don't use those terms in guild chat. {remaining}",
        "{user}, that's a filtered term — watch your language! {remaining}",
        "{user}, we don't allow brainrot in guild chat. {remaining}",
        '{user}, please keep guild chat brainrot-free! {remaining}',
        '{user}, filtered term detected — please stop. {remaining}',
        '{user}, consider this a warning — no brainrot in chat. {remaining}',
        '{user}, that term is blocked. Please use appropriate language. {remaining}',
    ];
    // Default configuration
    defaultConfig = {
        enabled: true,
        action: 'mute',
        muteDuration: '1h',
        warnBeforeMute: true,
        maxWarnings: 2,
        warningResetMinutes: 60,
        warningChannel: 'both',
        notifyOfficerChat: true,
        logToConsole: true,
        customBlockedTerms: [],
        customAllowedTerms: [],
        exemptRanks: [],
        // Escalating mute durations for repeat offenders
        // 1st offense = muteDuration (above), then escalate through this list
        offenses: [
            { duration: '1h', message: 'Second offense — muted for 1 hour.' },
            { duration: '1d', message: 'Third offense — muted for 1 day.' },
        ],
        // Hours within which offenses count as repeat (resets after this window)
        offenseResetHours: 24,
    };
    // ─── Lifecycle ───────────────────────────────────────────────────────────
    async init(context, api) {
        this.api = api;
        api.log.info('🧠 Initializing Brainrot Filter Extension...');
        // Load config (try api.config first, then fall back to direct file load)
        let config = api.config || {};
        if (!config || Object.keys(config).length === 0) {
            try {
                const fs = require('fs');
                const path = require('path');
                const configPath = path.join(__dirname, '..', 'config.json');
                if (fs.existsSync(configPath)) {
                    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                    api.log.info('Brainrot Filter: loaded config.json directly');
                }
            }
            catch (error) {
                api.log.error('Brainrot Filter: failed to load config:', error);
            }
        }
        this.config = { ...this.defaultConfig, ...config };
        if (!this.config.enabled) {
            api.log.warn('Brainrot Filter is disabled in configuration');
            return;
        }
        // Build allowed-terms set
        for (const term of this.config.customAllowedTerms) {
            this.allowedTerms.add(term.toLowerCase());
        }
        // Build the master regex from all blocked terms
        this.buildBlockedRegex();
        // Start cleanup interval for expired warnings
        this.cleanupInterval = setInterval(() => this.cleanupWarnings(), 5 * 60 * 1000 // every 5 minutes
        );
        api.log.success(`🧠 Brainrot Filter initialized — ${this.getTermCount()} terms blocked, action="${this.config.action}", warnFirst=${this.config.warnBeforeMute}, exempt: ${[...this.exemptRanks].join(', ') || 'none'}`);
    }
    async destroy(_context, _api) {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.warnings.clear();
        this.muteHistory.clear();
    }
    async onDisable(_context, api) {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.warnings.clear();
        this.muteHistory.clear();
        api.log.info('Brainrot Filter disabled');
    }
    async healthCheck() {
        return this.config.enabled !== false;
    }
    // ─── Chat patterns ───────────────────────────────────────────────────────
    getChatPatterns() {
        if (!this.config.enabled)
            return [];
        return [
            {
                id: 'brainrot-guild-chat',
                extensionId: 'brainrot-filter',
                // Match guild chat messages: Guild > [RANK] Username [TAG]: message
                pattern: /^Guild > (?:\[[^\]]+\]\s+)?([A-Za-z0-9_]{3,16})(?:\s+\[[^\]]+\])?:\s*(.+)$/,
                priority: 3, // Run before most command handlers but after critical system patterns
                passthrough: true, // Must be passthrough — this is a passive scanner, not a command handler.
                // Without this, it consumes every guild chat message and blocks
                // all subsequent command patterns (!bw, !sw, etc.) from running.
                description: 'Scans guild chat messages for brainrot terms',
                handler: this.handleGuildChat.bind(this),
            },
        ];
    }
    // ─── Core handler ────────────────────────────────────────────────────────
    async handleGuildChat(context, api) {
        if (!this.config.enabled || !this.blockedRegex)
            return;
        const username = context.matches?.[1] || context.username;
        const message = context.matches?.[2] || context.message;
        if (!username || !message)
            return;
        // Check if user's rank is exempt
        if (this.isExempt(context))
            return;
        // Normalise the message for matching (lowercase, collapse whitespace)
        const normalised = this.normalise(message);
        // Test against the master regex
        const matchResult = normalised.match(this.blockedRegex);
        if (!matchResult)
            return;
        const matchedTerm = matchResult[0];
        // Double-check: is the matched term in the allow-list?
        if (this.allowedTerms.has(matchedTerm.toLowerCase()))
            return;
        api.log.warn(`🧠 Brainrot detected from ${username}: "${message}" (matched: "${matchedTerm}")`);
        // Take action
        await this.takeAction(username, matchedTerm, message, api);
    }
    // ─── Actions ─────────────────────────────────────────────────────────────
    async takeAction(username, matchedTerm, originalMessage, api) {
        const action = this.config.action;
        if (action === 'log') {
            // Just log, no in-game action
            if (this.config.notifyOfficerChat) {
                api.chat.sendOfficerChat(`[Filter] ${username} said "${matchedTerm}" in guild chat`);
            }
            return;
        }
        if (action === 'warn' || (action === 'mute' && this.config.warnBeforeMute)) {
            const entry = this.getOrCreateWarning(username);
            entry.count++;
            entry.lastWarning = Date.now();
            const shouldMute = action === 'mute' &&
                this.config.warnBeforeMute &&
                entry.count > this.config.maxWarnings;
            if (shouldMute) {
                // Exceeded warnings → mute
                await this.mutePlayer(username, matchedTerm, api);
                // Reset warnings after mute
                this.warnings.delete(username);
            }
            else {
                // Build the warning message from the rotating pool
                const remaining = action === 'mute' ? this.config.maxWarnings - entry.count + 1 : null;
                const remainingText = remaining !== null && remaining > 0
                    ? `(${remaining} warning(s) remaining before mute)`
                    : '';
                const warnMsg = this.getNextWarningMessage(username, remainingText);
                await this.sendWarning(username, warnMsg, api);
                if (this.config.notifyOfficerChat) {
                    await this.delay(600);
                    api.chat.sendOfficerChat(`[Filter] Warned ${username} (${entry.count}/${this.config.maxWarnings}) — matched: "${matchedTerm}"`);
                }
            }
            return;
        }
        if (action === 'mute' && !this.config.warnBeforeMute) {
            // Mute immediately
            await this.mutePlayer(username, matchedTerm, api);
            return;
        }
    }
    async mutePlayer(username, matchedTerm, api) {
        // Determine the offense number and pick the escalated duration
        const record = this.getOrCreateMuteRecord(username);
        record.offenseCount++;
        record.lastMuteTime = Date.now();
        const offenseNum = record.offenseCount; // 1 = first mute, 2 = second, etc.
        const offenses = this.config.offenses || [];
        let duration;
        if (offenseNum === 1) {
            // First offense — use base muteDuration
            duration = this.config.muteDuration || '1h';
        }
        else {
            // 2nd offense → offenses[0], 3rd → offenses[1], etc.
            const idx = offenseNum - 2;
            if (idx < offenses.length) {
                duration = offenses[idx].duration;
            }
            else {
                // Beyond configured offenses — use the last/longest one
                const last = offenses[offenses.length - 1];
                duration = last ? last.duration : this.config.muteDuration || '1h';
            }
        }
        // Mute the player (Hypixel only supports /g mute <user> <time>)
        api.chat.executeCommand(`/g mute ${username} ${duration}`);
        // DM the user the reason
        await this.delay(600);
        api.chat.sendPrivateMessage(username, `You have been guild muted for ${duration} due to brainrot in Guild Chat (offense #${offenseNum}).`);
        // Notify officer chat with full details
        await this.delay(600);
        api.chat.sendOfficerChat(`[Filter] ${username} has been guild muted for ${duration} due to brainrot in Guild Chat (offense #${offenseNum}, matched: "${matchedTerm}")`);
        api.log.info(`🧠 Muted ${username} for ${duration} — offense #${offenseNum} (term: "${matchedTerm}")`);
    }
    // ─── Regex builder ───────────────────────────────────────────────────────
    /**
     * Builds a single compiled regex from all blocked terms (built-in + custom).
     * Uses word boundaries (\b) so short terms like "69" or "mog" don't match
     * inside longer words or numbers (e.g. "169", "mogul").
     */
    buildBlockedRegex() {
        const allTerms = [...exports.BRAINROT_TERMS, ...(this.config.customBlockedTerms || [])];
        // Filter out allowed terms
        const filtered = allTerms.filter((t) => !this.allowedTerms.has(t.toLowerCase()));
        if (filtered.length === 0) {
            this.blockedRegex = null;
            return;
        }
        // Sort longest-first so multi-word phrases match before their sub-words
        filtered.sort((a, b) => b.length - a.length);
        // Escape special regex characters, then wrap each term with \b word boundaries
        const escaped = filtered.map((t) => `\\b${this.escapeRegex(t)}\\b`);
        const pattern = `(?:${escaped.join('|')})`;
        this.blockedRegex = new RegExp(pattern, 'i');
    }
    getTermCount() {
        const allTerms = [...exports.BRAINROT_TERMS, ...(this.config.customBlockedTerms || [])];
        const filtered = allTerms.filter((t) => !this.allowedTerms.has(t.toLowerCase()));
        return filtered.length;
    }
    // ─── Helpers ─────────────────────────────────────────────────────────────
    normalise(text) {
        return text
            .toLowerCase()
            .replace(/[.,!?;:'"(){}[\]<>]/g, ' ') // strip punctuation
            .replace(/\s+/g, ' ') // collapse whitespace
            .trim();
    }
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    isExempt(context) {
        if (this.exemptRanks.size === 0)
            return false;
        // Check guildRank from context
        const guildRank = context.guildRank;
        if (guildRank) {
            const rankTag = guildRank.startsWith('[') ? guildRank : `[${guildRank}]`;
            if (this.exemptRanks.has(rankTag))
                return true;
        }
        return false;
    }
    getOrCreateWarning(username) {
        const resetMs = (this.config.warningResetMinutes || 60) * 60 * 1000;
        let entry = this.warnings.get(username);
        if (!entry || Date.now() - entry.lastWarning > resetMs) {
            entry = { count: 0, lastWarning: Date.now() };
            this.warnings.set(username, entry);
        }
        return entry;
    }
    /**
     * Get or create a mute record for a user.
     * Resets if the last mute was longer than offenseResetHours ago.
     */
    getOrCreateMuteRecord(username) {
        const resetMs = (this.config.offenseResetHours || 24) * 60 * 60 * 1000;
        let record = this.muteHistory.get(username);
        if (!record || Date.now() - record.lastMuteTime > resetMs) {
            record = { offenseCount: 0, lastMuteTime: Date.now() };
            this.muteHistory.set(username, record);
        }
        return record;
    }
    cleanupWarnings() {
        const warningResetMs = (this.config.warningResetMinutes || 60) * 60 * 1000;
        const offenseResetMs = (this.config.offenseResetHours || 24) * 60 * 60 * 1000;
        const now = Date.now();
        for (const [username, entry] of this.warnings.entries()) {
            if (now - entry.lastWarning > warningResetMs) {
                this.warnings.delete(username);
            }
        }
        for (const [username, record] of this.muteHistory.entries()) {
            if (now - record.lastMuteTime > offenseResetMs) {
                this.muteHistory.delete(username);
            }
        }
    }
    /**
     * Get the next warning message from the rotating pool, substituting
     * {user} and {remaining} placeholders.
     */
    getNextWarningMessage(username, remainingText) {
        const messages = BrainrotFilterExtension.WARNING_MESSAGES;
        const template = messages[this.warningMessageIndex % messages.length];
        this.warningMessageIndex++;
        return (template ?? '{user}, please avoid brainrot terms in guild chat. {remaining}')
            .replace(/\{user\}/g, username)
            .replace(/\{remaining\}/g, remainingText)
            .replace(/\s{2,}/g, ' ') // collapse any double spaces from empty remaining
            .trim();
    }
    /**
     * Send a warning to the configured channel(s).
     * warningChannel: "guild" | "dm" | "both"
     */
    async sendWarning(username, message, api) {
        const channel = this.config.warningChannel || 'both';
        if (channel === 'guild' || channel === 'both') {
            api.chat.sendGuildChat(message);
        }
        if (channel === 'dm' || channel === 'both') {
            // Delay between guild chat and DM to avoid rate limiting
            if (channel === 'both')
                await this.delay(600);
            // Use a slightly different phrasing for the DM to avoid duplicate message detection
            const dmMessage = channel === 'both' ? `[Warning] ${message}` : message;
            api.chat.sendPrivateMessage(username, dmMessage);
        }
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.default = BrainrotFilterExtension;
