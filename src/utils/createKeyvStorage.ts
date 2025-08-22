import type Keyv from '@keyvhq/core';
import type { BuildStorage } from 'axios-cache-interceptor';
import { type AxiosStorage, buildStorage } from 'axios-cache-interceptor';

export function createKeyvStorage(keyv: Keyv): AxiosStorage {
    const storage: BuildStorage = {
        async find(key: string) {
            return await keyv.get(key);
        },

        async set(key: string, value) {
            const ttl = value.state === 'cached' ? value.ttl : undefined;
            await keyv.set(key, value, ttl);
        },

        async remove(key: string) {
            await keyv.delete(key);
        },

        async clear() {
            await keyv.clear();
        },
    };

    return buildStorage(storage);
}
