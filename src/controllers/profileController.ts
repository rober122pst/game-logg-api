import type { NextFunction, Request, Response } from 'express';
import type { UserRating } from '../../generated/prisma/client.ts';
import { prisma } from '../prisma.ts';
import { getGenreStats } from '../services/statsServices.ts';

export const getProfileData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            return res.status(403).json({ message: 'Whoa there! You need to be logged in to perform this action.' });
        }
        const userId = req.user.id;

        const topGenres = await getGenreStats(userId);
        const favoriteGames = await prisma.userGame.findMany({
            where: { rating: { favorite: true }, userId: userId },
            include: {
                game: { select: { id: true, igdbId: true, coverUrl: true, title: true, slug: true } },
                rating: true,
            },
        });
        const playingNow = await prisma.userGame.findMany({
            where: { status: 'PLAYING', userId },
            select: {
                game: {
                    select: { title: true },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        function getOverall(rating: UserRating | null) {
            if (!rating) return -Infinity;
            return (rating.gameplay + rating.graphics + rating.story + rating.sound) / 4;
        }

        favoriteGames.sort((a, b) => {
            return getOverall(b.rating) - getOverall(a.rating);
        });

        res.status(200).json({
            playingNow: {
                currentGame: playingNow[0]?.game.title || 'Nenhum jogo',
                totalPlaying: playingNow.length - 1,
            },
            topGenres,
            favoriteGames,
        });
    } catch (error) {
        next(error);
    }
};
