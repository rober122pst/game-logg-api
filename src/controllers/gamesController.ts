import apicalypse from 'apicalypse';
import type { NextFunction, Request, Response } from 'express';

import { prisma } from '../prisma.ts';
import { requestOptions } from '../utils/requestOptions.ts';

export const createGame = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const gameData = req.body as { gameName: string };
        gameData.gameName = gameData.gameName.trim();

        if (!gameData.gameName) return res.status(400).json({ message: 'Game name is required' });

        type IGDBGame = {
            id: string;
            slug: string;
            name: string;
            platforms: string[];
            first_release_date: string;
            genres: string[];
            cover: string;
            screenshots: string[];
            storyline: string;
            rating: number;
        };

        const igdbResponse = await apicalypse(requestOptions)
            .fields(
                'slug,name,platforms.name,first_release_date,genres.name,cover,screenshots.image_id,storyline,rating'
            )
            .limit(1)
            .search(gameData.gameName)
            .request('/games');

        console.log(igdbResponse.data);

        if (!igdbResponse.data) return res.status(404).json({ message: 'Game not found in IGDB' });

        const igdbGame = igdbResponse.data[0] as IGDBGame;

        const gameArtworksResponse = await apicalypse(requestOptions)
            .fields('image_id')
            .where(`game = ${igdbGame.id} & artwork_type = 2`)
            .request('/artworks');

        const game = await prisma.game.create({
            data: {
                slug: igdbGame.slug,
                title: igdbGame.name,
                releaseDate: igdbGame.first_release_date,
                coverUrl: igdbGame.cover,
                bannerUrl: gameArtworksResponse.data[0],
                Screenshots: igdbGame.screenshots,
                description: igdbGame.storyline,
                externalIds: {
                    igdb: igdbGame.id,
                },
                preferedSource: 'igdb',
                ratings: [
                    {
                        name: 'IGN',
                        score: igdbGame.rating,
                    },
                ],
            },
        });

        res.status(200).json({
            message: 'Jogo criado com sucesso',
            game,
        });
    } catch (error) {
        next(error);
    }
};

export const getGames = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const games = await prisma.game.findMany();
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
