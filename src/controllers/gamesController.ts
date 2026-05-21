import type { NextFunction, Request, Response } from 'express';

import apicalypse from 'apicalypse';
import { prisma } from '../prisma.ts';
import { createGameWithIGDB } from '../services/gamesServices.ts';
import { requestOptions } from '../utils/requestOptions.ts';

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
            .where('game_modes = (1) & (game_type = 0 | game_type = 8) & total_rating_count > 0') // Somente jogos singleplayer
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
