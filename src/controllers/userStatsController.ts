import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../prisma.ts';
import { calcTotalTime } from '../services/statsServices.ts';

// pegar estatísticas completas para exibir no profile
export const getProfileStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.validatedId) return res.status(400).json({ message: 'User ID is required' });
        const userId = req.validatedId;

        const beatedGames = await prisma.userGame.count({
            where: {
                userId,
                beatEvents: {
                    some: {
                        action: 'BEATED',
                    },
                },
            },
        });

        const platinumGames = await prisma.userGame.count({
            where: {
                userId,
                beatEvents: {
                    some: {
                        action: 'PLATINUM',
                    },
                },
            },
        });

        const totalPlaytime = calcTotalTime(userId);

        res.json({ beatedGames, platinumGames, totalPlaytime });
    } catch (error) {
        next(error);
    }
};

export const getMostPlayedPlatforms = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const top3Platforms = await prisma.beatEvents.aggregateRaw({
        //     pipeline: [
        //         { $group: { _id: '$platformId', totalTime: { $sum: '$timeToBeat' } } },
        //         { $sort: { totalTime: -1 } },
        //         { $limit: 3 },
        //         { $lookup: { from: 'PlayedPlatform', localField: '_id', foreingField: '_id', as: 'playedPlatform' } },
        //         { $unwind: '$playedPlatform' },
        //         { $playedPlatform: }
        //     ],
        // });
        if (!req.user?.id) return res.status(400).json({ message: 'User ID is required' });
        const userId = req.user.id;

        const topPlatforms = await prisma.playedPlatform.groupBy({
            by: ['platformId'],
            where: {
                userId,
            },
            _count: {
                platformId: true,
            },
            orderBy: {
                _count: {
                    platformId: 'desc',
                },
            },
        });

        const platforms = await prisma.platform.findMany({
            where: {
                id: {
                    in: topPlatforms.slice(0, 3).map((p) => p.platformId),
                },
            },
        });

        const top = topPlatforms.slice(0, 3).map((tp) => ({
            ...tp,
            platform: platforms.find((p) => p.id === tp.platformId),
        }));

        const result = top.map((t) => ({
            name: t.platform?.name,
            score: t._count.platformId,
            percent: t._count.platformId / topPlatforms.length,
        }));

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// // adicionar horas
// export const addHours = async (req, res) => {
//   try {
//     const { userId, year, hours } = req.body;
//     const stats = await UserStats.findOneAndUpdate(
//       { userId },
//       { $inc: { [`hoursByYear.${year}`]: hours } },
//       { new: true, upsert: true }
//     );
//     res.json(stats);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// // adicionar jogo zerado
// export const addCompletedGame = async (req, res) => {
//   try {
//     const { userId, title, year } = req.body;
//     const stats = await UserStats.findOneAndUpdate(
//       { userId },
//       { $push: { gamesCompleted: { title, year } } },
//       { new: true, upsert: true }
//     );
//     res.json(stats);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };
