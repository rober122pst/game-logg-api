// // controllers/userStatsController.js

import type { NextFunction, Request, Response } from 'express';

import { prisma } from '../prisma.ts';

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

        const totalPlaytime = await prisma.beatEvents.aggregate({
            where: { userGame: { userId } },
            _sum: { timeToEvent: true },
        });

        res.json({ beatedGames, platinumGames, totalPlaytime: totalPlaytime._sum.timeToEvent || 0 });
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
