import NodeCache from 'node-cache';
import { MOJANG_API_BASE } from '@/config/constants';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

export interface MojangProfile {
    id: string;
    name: string;
}

export const mojangService = {
    async getProfile(username: string): Promise<MojangProfile | null> {
        const key = `profile:${username.toLowerCase()}`;
        const cached = cache.get<MojangProfile>(key);
        if (cached) return cached;

        try {
            const res = await fetch(`${MOJANG_API_BASE}/users/profiles/minecraft/${username}`);
            if (res.status === 200) {
                const data = (await res.json()) as MojangProfile;
                cache.set(key, data);
                cache.set(`uuid:${data.id}`, data);
                return data;
            }
            return null;
        } catch {
            return null;
        }
    },

    async getByUuid(uuid: string): Promise<MojangProfile | null> {
        const key = `uuid:${uuid}`;
        const cached = cache.get<MojangProfile>(key);
        if (cached) return cached;

        try {
            const cleanUuid = uuid.replace(/-/g, '');
            const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${cleanUuid}`);
            if (res.status === 200) {
                const data = (await res.json()) as MojangProfile;
                cache.set(key, data);
                cache.set(`profile:${data.name.toLowerCase()}`, data);
                return data;
            }
            return null;
        } catch {
            return null;
        }
    },
};
