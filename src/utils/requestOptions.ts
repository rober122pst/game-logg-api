import type { ApicalypseConfig } from 'apicalypse';

export const requestOptions: ApicalypseConfig = {
    queryMethod: 'body',
    method: 'POST',
    baseURL: 'https://api.igdb.com/v4',
    headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${process.env.TWITCH_ACCESS_TOKEN!}`,
    },
    responseType: 'json',
    timeout: 3000,
};
