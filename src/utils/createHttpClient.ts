import type Keyv from '@keyvhq/core';
import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import { addAxiosDateTransformer } from 'axios-date-transformer';
import { createKeyvStorage } from './createKeyvStorage.ts';

export interface CreateHttpClientOptions {
    config?: CreateAxiosDefaults;
    instance?: AxiosInstance;
}

export interface CreateCacheableHttpClientOptions extends CreateHttpClientOptions {
    keyv: Keyv;
    defaultMsTtl?: number;
}

export const createHttpClient = ({ config, instance }: CreateHttpClientOptions = {}): AxiosInstance => {
    const axiosInstance = instance || axios.create(config);

    return addAxiosDateTransformer(axiosInstance);
};

export const createCacheableHttpClient = (options: CreateCacheableHttpClientOptions) => {
    const { config, instance, keyv, defaultMsTtl } = options;
    const client = createHttpClient({ config, instance });
    return setupCache(client, {
        storage: createKeyvStorage(keyv),
        ttl: defaultMsTtl,
    });
};
