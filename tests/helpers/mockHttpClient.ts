import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';

// This sets the mock adapter on the default instance

export const mockHttpClient = new AxiosMockAdapter(axios);
