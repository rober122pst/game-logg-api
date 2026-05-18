import type { ApicalypseConfig } from 'apicalypse';
import 'dotenv/config';

const clientId = process.env.TWITCH_CLIENT_ID;
const token = process.env.TWITCH_ACCESS_TOKEN;

if (!clientId || !token) {
    console.error('IGDB API credentials are not set in environment variables');
}

export const requestOptions: ApicalypseConfig = {
    queryMethod: 'body',
    method: 'POST',
    baseURL: 'https://api.igdb.com/v4',
    headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${token}`,
    },
    responseType: 'json',
    timeout: 3000,
};
