import env from '@/config/env';
import { BRAINROT_TERMS } from '@/bridge/filters/brainrot-filter';

export interface FilterResult {
    allowed: boolean;
    reason?: string;
}

export function applyFilters(content: string, username: string): FilterResult {
    // Bridge-ban check is done upstream in message-create event

    // Brainrot filter
    if (env.USE_BRAINROT_FILTER && containsBrainrot(content)) {
        return { allowed: false, reason: 'brainrot terms are not allowed!' };
    }

    return { allowed: true };
}

function containsBrainrot(text: string): boolean {
    const lower = text.toLowerCase();
    return BRAINROT_TERMS.some((term) => lower.includes(term));
}
