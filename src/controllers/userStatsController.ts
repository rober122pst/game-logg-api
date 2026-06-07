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

        const totalPlaytime = await calcTotalTime(userId);

        res.json({ beatedGames, platinumGames, totalPlaytime });
    } catch (error) {
        next(error);
    }
};

export const getMostPlayedPlatforms = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) return res.status(400).json({ message: 'User ID is required' });
        const userId = req.user.id;

        const totalTimeAgg = await prisma.playedPlatform.aggregate({
            where: { userId },
            _sum: {
                totalMinutes: true,
            },
        });

        const allTotalMinutes = totalTimeAgg._sum.totalMinutes || 0;

        const topPlatforms = await prisma.playedPlatform.findMany({
            where: { userId },
            orderBy: {
                totalMinutes: 'desc',
            },
            take: 3,
            include: {
                platform: true,
            },
        });

        const result = topPlatforms.map((tp) => ({
            name: tp.platform?.name,
            score: tp.totalMinutes,
            percent: allTotalMinutes > 0 ? tp.totalMinutes / allTotalMinutes : 0,
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
