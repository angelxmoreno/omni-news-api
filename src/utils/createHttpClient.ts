import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios';
import { addAxiosDateTransformer } from 'axios-date-transformer';

export type CreateHttpClientOptions = {
    config?: CreateAxiosDefaults;
    instance?: AxiosInstance;
};

export const createHttpClient = ({ config, instance }: CreateHttpClientOptions = {}): AxiosInstance => {
    const axiosInstance = instance || axios.create(config);

    return addAxiosDateTransformer(axiosInstance);
};
