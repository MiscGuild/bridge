/**
 * Brainrot Terms — shared dictionary and checker.
 *
 * Used by:
 *   - extensions/brainrot-filter (in-game guild chat scanning)
 *   - src/discord/events/message.ts (Discord → Minecraft relay blocking)
 */

// ─── Built-in blocked terms ──────────────────────────────────────────────────
// Each entry is turned into a case-insensitive regex with word-boundary logic.
// Grouped by category for maintainability.

export const BRAINROT_TERMS: string[] = [
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

// ─── Standalone brainrot checker ─────────────────────────────────────────────

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const _brainrotRegex: RegExp = (() => {
    const sorted = [...BRAINROT_TERMS].sort((a, b) => b.length - a.length);
    const escaped = sorted.map((t) => `\\b${escapeRegex(t)}\\b`);
    return new RegExp(`(?:${escaped.join('|')})`, 'i');
})();

/**
 * Returns the matched brainrot term if the text contains one, or `null` otherwise.
 */
export function containsBrainrot(text: string): string | null {
    const normalised = text
        .toLowerCase()
        .replace(/[.,!?;:'"(){}[\]<>]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const match = normalised.match(_brainrotRegex);
    return match ? match[0] : null;
}
