import type { NextFunction, Request, Response } from 'express';

import apicalypse from 'apicalypse';
import NodeCache from 'node-cache';
import { z } from 'zod';
import { prisma } from '../prisma.ts';
import { createGameWithIGDB, type IGDBGame } from '../services/gamesServices.ts';
import { requestOptions, type PopScorePrimitive } from '../utils/requestOptions.ts';

export const createGame = async (req: Request, res: Response, next: NextFunction) => {
    console.log(process.env.TWITCH_ACCESS_TOKEN, process.env.TWITCH_CLIENT_ID);
    try {
        if (!req.validatedId) return res.status(400).json({ message: 'Game id is required' });

        const existedGame = await prisma.game.findUnique({
            where: {
                igdbId: Number(req.validatedId),
            },
            include: {
                platforms: true,
                genres: true,
            },
        });

        console.log(existedGame);

        if (existedGame) return res.status(200).json({ message: 'Game already exists', game: existedGame });

        const { data, status } = await createGameWithIGDB(Number(req.validatedId));

        console.log(data);

        res.status(status).json(data);
    } catch (error) {
        next(error);
    }
};

export const getGameSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = req.query.q as string;
        if (!query || query.length < 3) return res.json([]);

        const igdbResponse = await apicalypse(requestOptions)
            .fields('id, name, slug, cover.image_id, total_rating_count, game_type.*')
            .where('game_modes = (1) & (game_type = 0 | game_type = 8) & total_rating_count > 0 & themes != (40)') // Somente jogos singleplayer
            .search(query)
            .limit(50)
            .request('/games');

        const igdbGames = igdbResponse.data || [];

        igdbGames.sort((a: { total_rating_count: number }, b: { total_rating_count: number }) => {
            const ratingA = a.total_rating_count || 0;
            const ratingB = b.total_rating_count || 0;
            return ratingB - ratingA;
        });

        const topGames = igdbGames.slice(0, 5);

        const suggestions = topGames.map(
            (game: {
                id: number;
                name: string;
                slug: string;
                cover: { image_id: string };
                total_rating_count: number;
                game_type: { type: string };
            }) => ({
                igdbId: game.id,
                title: game.name,
                slug: game.slug,
                coverUrl: game.cover
                    ? `https://images.igdb.com/igdb/image/upload/t_cover_small/${game.cover.image_id}.jpg`
                    : null,
                totalRatingCount: game.total_rating_count,
                game_type: game.game_type.type,
            })
        );

        return res.status(200).json(suggestions);
    } catch (error) {
        next(error);
    }
};

export const getGames = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const take = req.query.take ?? 10;

        const games = await prisma.game.findMany({
            take: Number(take),
        });
        res.status(200).json(games);
    } catch (error) {
        next(error);
    }
};

export const getGameById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.validatedId) return res.status(400).json({ message: 'Invalid game id' });

        const game = await prisma.game.findUnique({
            where: { id: req.validatedId },
        });
        if (!game) return res.status(404).json({ message: 'Game not found' });
        res.json(game);
    } catch (error) {
        next(error);
    }
};

const myCache = new NodeCache({ stdTTL: 43200, checkperiod: 120 });

export const getPopularGames = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const querySchema = z.object({
            take: z.coerce
                .number('Take must be a interger.')
                .positive('Really bro? Take must be greater than zero.')
                .max(100, "The maximum limit is 100. Don't try to break our backend...")
                .int('Only whole numbers. How are we supposed to deliver half a game to you?')
                .default(10),
        });
        const params = querySchema.safeParse(req.query);
        if (!params.success) {
            return res.status(400).json({ message: params.error.message });
        }

        const cacheKey = `popular_games_${params.data.take}`;
        const cachedData = myCache.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({ success: true, data: cachedData, fromCache: true });
        }

        const daysAgo = 180;
        const limitTimestamp = Math.floor((Date.now() - daysAgo * 24 * 60 * 60 * 1000) / 1000);

        const popResponse = await apicalypse(requestOptions)
            .fields(['game_id', 'value'])
            .where('popularity_type = 2')
            .sort('value', 'desc')
            .limit(100)
            .request('/popularity_primitives');

        const popData = popResponse.data as PopScorePrimitive[];

        // Se não retornar nada, já encerramos a requisição
        if (!popData || popData.length === 0) {
            res.status(200).json({ success: true, data: [] });
            return;
        }

        // Mapeamos os IDs e criamos o dicionário de valores de popularidade
        const gameIds = popData.map((p) => p.game_id);
        const popScoreMap = new Map<number, number>();
        popData.forEach((p) => popScoreMap.set(p.game_id, p.value));

        // ====================================================================
        // PASSO 2: Buscar detalhes dos jogos usando o builder
        // ====================================================================
        const gameResponse = await apicalypse(requestOptions)
            .fields(['name', 'game_type', 'game_modes', 'total_rating_count', 'cover.image_id, slug'])
            .where(
                [
                    `id = (${gameIds.join(',')})`,
                    'game_modes = (1)',
                    'game_type = (0, 8)',
                    'total_rating_count > 0',
                    `first_release_date >= ${limitTimestamp}`,
                ].join(' & ')
            ) // Agrupando todos os filtros em uma única string lógica
            .limit(100)
            .request('/games');

        const gameData = gameResponse.data as IGDBGame[];

        const finalGames = gameData
            .map((game) => ({
                ...game,
                coverUrl: `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`,
                pop_score_value: popScoreMap.get(game.id) || 0,
                igdbId: game.id,
                title: game.name,
            }))
            .sort((a, b) => (b.pop_score_value || 0) - (a.pop_score_value || 0))
            .slice(0, params.data.take);

        myCache.set(cacheKey, finalGames);

        res.status(200).json({
            success: true,
            data: finalGames,
        });
    } catch (error) {
        next(error);
    }
};
