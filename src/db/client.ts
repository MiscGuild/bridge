import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { consola } from 'consola';
import env from '@/config/env';

let _client: SupabaseClient | null = null;
let _connectionTested = false;

export function getSupabaseClient(): SupabaseClient | null {
    if (_client) return _client;

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
        return null;
    }

    _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false },
    });

    // One-time connectivity test on first init
    if (!_connectionTested) {
        _connectionTested = true;
        _client
            .from('mutes')
            .select('id')
            .limit(1)
            .then(({ error }) => {
                if (error) {
                    consola.error(
                        `[Supabase] Connection test FAILED: ${error.message} (${error.code}). Run schema.sql in the Supabase SQL editor.`
                    );
                } else {
                    consola.success('[Supabase] Connected and tables accessible.');
                }
            });
    }

    return _client;
}

export function requireSupabase(): SupabaseClient {
    const client = getSupabaseClient();
    if (!client) {
        consola.fatal('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
        process.exit(1);
    }
    return client;
}

export const isSupabaseEnabled = (): boolean =>
    Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY);
