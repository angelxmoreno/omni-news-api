import type Keyv from '@keyvhq/core';
import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios';
import { type CacheOptions, setupCache } from 'axios-cache-interceptor';
import { createKeyvStorage, type KeyvStorageOptions } from 'axios-cache-interceptor-keyv';
import { addAxiosDateTransformer } from 'axios-date-transformer';

export interface CreateHttpClientOptions {
    config?: CreateAxiosDefaults;
    instance?: AxiosInstance;
}

export type CreateCacheableHttpClientOptions = CreateHttpClientOptions & {
    cacheOptions?: Omit<CacheOptions, 'storage'>;
    keyv: Keyv;
    keyvStorageOptions?: KeyvStorageOptions;
};
export const createHttpClient = ({ config, instance }: CreateHttpClientOptions = {}): AxiosInstance => {
    const axiosInstance = instance || axios.create(config);

    return addAxiosDateTransformer(axiosInstance);
};

export const createCacheableHttpClient = ({
    config,
    instance,
    keyv,
    cacheOptions,
    keyvStorageOptions,
}: CreateCacheableHttpClientOptions) => {
    const client = createHttpClient({ config, instance });
    const setupCacheOptions: CacheOptions = {
        storage: createKeyvStorage(keyv, keyvStorageOptions),
        ...cacheOptions,
    };
    return setupCache(client, setupCacheOptions);
};
