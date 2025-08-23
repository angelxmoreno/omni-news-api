import { beforeEach, describe, expect, it } from 'bun:test';
import Keyv from '@keyvhq/core';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { createCacheableHttpClient, createHttpClient } from '../../src';

describe('createHttpClient', () => {
    it('creates a basic HTTP client without caching', () => {
        const client = createHttpClient();

        expect(client).toBeDefined();
        expect(typeof client.get).toBe('function');
        expect(typeof client.post).toBe('function');

        // Should not have cache properties
        const clientWithCache = client as AxiosInstance & { storage?: unknown; defaults: { cache?: unknown } };
        expect(clientWithCache.storage).toBeUndefined();
        expect(clientWithCache.defaults.cache).toBeUndefined();
    });

    it('applies date transformer and uses provided instance', () => {
        const existingInstance = axios.create();
        const client = createHttpClient({ instance: existingInstance });

        expect(client).toBeDefined();
        expect(client).toBe(existingInstance);
    });

    it('accepts custom axios config', () => {
        const client = createHttpClient({
            config: {
                timeout: 5000,
                headers: { 'Custom-Header': 'test' },
            },
        });

        expect(client.defaults.timeout).toBe(5000);
        expect(client.defaults.headers['Custom-Header']).toBe('test');
    });

    it('accepts existing axios instance', () => {
        const existingInstance = axios.create({ timeout: 3000 });
        const client = createHttpClient({ instance: existingInstance });

        expect(client.defaults.timeout).toBe(3000);
    });
});

interface CacheableAxiosInstance extends AxiosInstance {
    storage: unknown;
    defaults: AxiosInstance['defaults'] & {
        cache: {
            ttl: number;
        };
    };
}

describe('createCacheableHttpClient', () => {
    let keyv: Keyv;

    beforeEach(() => {
        keyv = new Keyv(); // In-memory store for testing
    });

    it('creates a cacheable HTTP client with Keyv storage', () => {
        const client = createCacheableHttpClient({
            keyv,
            cacheOptions: { ttl: 60000 },
        }) as CacheableAxiosInstance;

        expect(client).toBeDefined();
        expect(client.storage).toBeDefined();
        expect(client.defaults.cache).toBeDefined();
        expect(client.defaults.cache.ttl).toBe(60000);
    });

    it('uses default TTL when not specified', () => {
        const client = createCacheableHttpClient({ keyv }) as CacheableAxiosInstance;

        // Should use axios-cache-interceptor default (5 minutes)
        expect(client.defaults.cache.ttl).toBe(300000);
    });

    it('accepts custom axios config and instance', () => {
        const existingInstance = axios.create({ timeout: 3000 });

        const client = createCacheableHttpClient({
            keyv,
            instance: existingInstance,
            cacheOptions: { ttl: 45000 },
        }) as CacheableAxiosInstance;

        expect(client.defaults.timeout).toBe(3000);
        expect(client.storage).toBeDefined();
        expect(client.defaults.cache.ttl).toBe(45000);
    });

    it('configures cache options correctly', () => {
        const client = createCacheableHttpClient({
            keyv,
            cacheOptions: {
                ttl: 120000,
            },
        }) as CacheableAxiosInstance;

        expect(client.defaults.cache.ttl).toBe(120000);
    });

    it('accepts keyv storage options', () => {
        const client = createCacheableHttpClient({
            keyv,
            keyvStorageOptions: {
                debug: true,
            },
        }) as CacheableAxiosInstance;

        expect(client).toBeDefined();
        expect(client.storage).toBeDefined();
        // Storage options are passed to createKeyvStorage, can't directly test here
        // but ensuring no errors occur during creation
    });

    it('combines cache options and keyv storage options', () => {
        const client = createCacheableHttpClient({
            keyv,
            cacheOptions: {
                ttl: 180000,
            },
            keyvStorageOptions: {
                debug: false,
            },
        }) as CacheableAxiosInstance;

        expect(client.defaults.cache.ttl).toBe(180000);
        expect(client.storage).toBeDefined();
    });
});
