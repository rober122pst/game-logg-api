/* eslint-disable quotes */
import type { NextFunction, Request, Response } from 'express';
import { addBeatEvent, createUserGameService, ratingGame } from '../services/userGamesServices.ts';
import {
    createBeatEventSchema,
    createRatingSchema,
    createUserGameSchema,
    getUserGamesQuerySchema,
} from '../services/userGamesValidation.ts';

import { ZodError } from 'zod';
import type { GameStatus } from '../../generated/prisma/enums.ts';
import { prisma } from '../prisma.ts';

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatZodError(error: ZodError<unknown>) {
    return error.issues.map((e) => ({
        field: e.path.join('.') || 'root',
        message: e.message,
    }));
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export const createUserGame = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            return res
                .status(403)
                .json({ message: 'Whoa there! You need to be logged in to add games to your library.' });
        }

        const parsed = createUserGameSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Hmm, something's off with the data you sent. Check the fields below!",
                errors: formatZodError(parsed.error),
            });
        }

        const { gameId } = parsed.data;

        const existing = await prisma.userGame.findUnique({
            where: { userId_gameId: { userId: req.user.id, gameId } },
        });

        if (existing) {
            return res
                .status(409)
                .json({ message: "Looks like you've already got this game in your library. No duplicates allowed!" });
        }

        // parsed.data may contain a status variant used only for client-side events (e.g. "BEAT_EVENT").
        // Cast to any to satisfy service input types while preserving runtime behavior.
        const userGame = await createUserGameService(req.user.id, parsed.data);
        res.status(201).json(userGame);
    } catch (error) {
        next(error);
    }
};

export const createBeatEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            return res.status(403).json({ message: 'You need to be logged in to register your achievements, hero!' });
        }

        if (!req.validatedId) {
            return res.status(400).json({ message: 'That game ID looks suspicious... did you drop it somewhere?' });
        }

        const parsed = createBeatEventSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: 'Your event data has some issues. Double-check and try again!',
                errors: formatZodError(parsed.error),
            });
        }

        const userGame = await prisma.userGame.findUnique({
            where: { id: req.validatedId },
        });

        if (!userGame) {
            return res
                .status(404)
                .json({ message: "We couldn't find that game in any library. Are you sure it's registered?" });
        }

        if (userGame.userId !== req.user.id) {
            return res
                .status(403)
                .json({ message: 'Nice try! You can only log events for games in your own library.' });
        }

        const beatEvent = await addBeatEvent(userGame, parsed.data);
        res.status(201).json(beatEvent);
    } catch (error) {
        next(error);
    }
};

export const createRating = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            return res.status(403).json({ message: 'You need to be logged in to drop a review!' });
        }

        if (!req.validatedId) {
            return res.status(400).json({ message: 'That game ID looks suspicious... did you drop it somewhere?' });
        }

        const parsed = createRatingSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: 'Your rating data seems a bit off. Give it another look!',
                errors: formatZodError(parsed.error),
            });
        }

        const userGame = await prisma.userGame.findUnique({
            where: { id: req.validatedId },
        });

        if (!userGame) {
            return res
                .status(404)
                .json({ message: "That game isn't in anyone's library. Make sure it's registered first!" });
        }

        if (userGame.userId !== req.user.id) {
            return res
                .status(403)
                .json({ message: "You can only rate games from your own library, not someone else's!" });
        }

        const existingRating = await prisma.userRating.findUnique({
            where: { userGameId: req.validatedId },
        });

        if (existingRating) {
            return res
                .status(409)
                .json({ message: "Hey, looks like you've already rated this one. No double dipping!" });
        }

        const rating = await ratingGame({ ...parsed.data, userGameId: req.validatedId });
        res.status(201).json(rating);
    } catch (error) {
        next(error);
    }
};

export const getUserGames = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.validatedId) {
            return res.status(400).json({ message: "That user ID doesn't look right. Are you sure it's correct?" });
        }

        const parsed = getUserGamesQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Those query params don't look right. Check the filters you're using!",
                errors: formatZodError(parsed.error),
            });
        }

        const userId = req.validatedId;
        const { gameId, favorite, status } = parsed.data;

        const query: { userId: string; favorite?: boolean; gameId?: string; status?: GameStatus } = { userId };

        if (favorite !== undefined) query.favorite = favorite === 'true';
        if (gameId) query.gameId = gameId;
        if (status) query.status = status;

        const library = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                library: {
                    where: { ...query },
                    orderBy: { game: { title: 'asc' } },
                    include: { game: true },
                },
            },
        });

        if (!library) {
            return res
                .status(404)
                .json({ message: "This player doesn't seem to exist in our records. Maybe they rage-quit?" });
        }

        res.status(200).json(library.library);
    } catch (error) {
        next(error);
    }
};
