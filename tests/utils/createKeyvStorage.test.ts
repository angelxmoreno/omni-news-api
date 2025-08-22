import { beforeEach, describe, expect, it } from 'bun:test';
import Keyv from '@keyvhq/core';
import type { CachedStorageValue, StaleStorageValue } from 'axios-cache-interceptor';
import { createKeyvStorage } from '../../src/utils/createKeyvStorage';

describe('createKeyvStorage', () => {
    let keyv: Keyv;
    let storage: ReturnType<typeof createKeyvStorage>;

    beforeEach(() => {
        keyv = new Keyv(); // In-memory store for testing
        storage = createKeyvStorage(keyv);
    });

    it('creates a storage instance with all required methods', () => {
        expect(storage).toBeDefined();
        expect(typeof storage.get).toBe('function');
        expect(typeof storage.set).toBe('function');
        expect(typeof storage.remove).toBe('function');
        expect(typeof storage.clear).toBe('function');
    });

    it('returns empty state for non-existent keys', async () => {
        const result = await storage.get('non-existent-key');
        expect(result).toEqual({ state: 'empty' });
    });

    it('stores and retrieves cached values with TTL', async () => {
        const cachedValue: CachedStorageValue = {
            state: 'cached',
            data: {
                data: { message: 'test' },
                headers: { 'content-type': 'application/json' },
                status: 200,
                statusText: 'OK',
            },
            ttl: 60000, // 1 minute
            createdAt: Date.now(),
        };

        await storage.set('cached-key', cachedValue);
        const result = await storage.get('cached-key');

        expect(result).toEqual(cachedValue);
    });

    it('stores stale values without TTL', async () => {
        const staleValue: StaleStorageValue = {
            state: 'stale',
            data: {
                data: { message: 'stale' },
                headers: { 'content-type': 'application/json' },
                status: 200,
                statusText: 'OK',
            },
            createdAt: Date.now(),
        };

        await storage.set('stale-key', staleValue);
        const result = await storage.get('stale-key');

        expect(result).toEqual(staleValue);
    });

    it('removes values from storage', async () => {
        const cachedValue: CachedStorageValue = {
            state: 'cached',
            data: {
                data: { message: 'test' },
                headers: {},
                status: 200,
                statusText: 'OK',
            },
            ttl: 60000,
            createdAt: Date.now(),
        };

        await storage.set('remove-test', cachedValue);

        // Verify it exists
        let result = await storage.get('remove-test');
        expect(result.state).toBe('cached');

        // Remove it
        await storage.remove('remove-test');

        // Verify it's gone
        result = await storage.get('remove-test');
        expect(result).toEqual({ state: 'empty' });
    });

    it('clears all values from storage', async () => {
        // Store multiple values
        const value1: CachedStorageValue = {
            state: 'cached',
            data: { data: 1, headers: {}, status: 200, statusText: 'OK' },
            ttl: 60000,
            createdAt: Date.now(),
        };

        const value2: CachedStorageValue = {
            state: 'cached',
            data: { data: 2, headers: {}, status: 200, statusText: 'OK' },
            ttl: 60000,
            createdAt: Date.now(),
        };

        await storage.set('key1', value1);
        await storage.set('key2', value2);

        // Verify they exist
        expect((await storage.get('key1')).state).toBe('cached');
        expect((await storage.get('key2')).state).toBe('cached');

        // Clear all
        await storage.clear();

        // Verify they're gone
        expect(await storage.get('key1')).toEqual({ state: 'empty' });
        expect(await storage.get('key2')).toEqual({ state: 'empty' });
    });

    it('handles TTL extraction correctly for different states', async () => {
        // Mock Keyv to track TTL usage
        const setCallsMock: Array<{ key: string; value: unknown; ttl?: number }> = [];
        const originalSet = keyv.set.bind(keyv);
        keyv.set = async (key: string, value: unknown, ttl?: number) => {
            setCallsMock.push({ key, value, ttl });
            return originalSet(key, value, ttl);
        };

        // Cached value with TTL
        const cachedValue: CachedStorageValue = {
            state: 'cached',
            data: { data: {}, headers: {}, status: 200, statusText: 'OK' },
            ttl: 30000,
            createdAt: Date.now(),
        };

        // Stale value without TTL
        const staleValue: StaleStorageValue = {
            state: 'stale',
            data: { data: {}, headers: {}, status: 200, statusText: 'OK' },
            createdAt: Date.now(),
        };

        await storage.set('cached', cachedValue);
        await storage.set('stale', staleValue);

        // Check TTL was extracted correctly
        expect(setCallsMock[0]).toMatchObject({
            key: 'cached',
            ttl: 30000,
        });

        expect(setCallsMock[1]).toMatchObject({
            key: 'stale',
            ttl: undefined,
        });
    });

    it('integrates properly with buildStorage cache logic', async () => {
        // This test verifies that our storage works with axios-cache-interceptor's buildStorage
        const cachedValue: CachedStorageValue = {
            state: 'cached',
            data: {
                data: { message: 'test' },
                headers: {},
                status: 200,
                statusText: 'OK',
            },
            ttl: 1, // Very short TTL to test expiration
            createdAt: Date.now() - 2, // Already expired
        };

        await storage.set('expired-key', cachedValue);

        // The buildStorage wrapper should handle expired cache cleanup
        // This would return 'empty' if buildStorage is working correctly
        const result = await storage.get('expired-key');

        // Since we're using buildStorage, it should handle expiration logic
        expect(result.state).toBe('empty');
    });
});
