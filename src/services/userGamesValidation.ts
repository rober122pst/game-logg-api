/* eslint-disable prettier/prettier */
import { z } from 'zod';

// ─── Enum mirrors (keep in sync with Prisma enums) ────────────────────────────

const GAME_STATUSES = ['PLAYING', 'I_WILL_PLAY', 'BEATED', 'DROPPED'] as const;
const OBJECTIVES = ['BEATED', 'COMPLETED', 'PLATINUM', 'PERFECT'] as const;
const BEAT_ACTIONS = ['BEATED', 'COMPLETED', 'PLATINUM', 'PERFECT'] as const;
const DATE_PRECISIONS = ['HOUR', 'DAY', 'MONTH', 'YEAR'] as const;
const GAME_DIFFICULTIES = ['D', 'C', 'B', 'A', 'S', 'SS'] as const;

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const createUserGameSchema = z.object({
    gameId: z.string().trim().min(1, { error: 'gameId cannot be empty' }),

    status: z.enum(GAME_STATUSES, {
        error: `status must be one of: ${GAME_STATUSES.join(', ')}`,
    }),

    objective: z.enum(OBJECTIVES, {
        error: `objective must be one of: ${OBJECTIVES.join(', ')}`,
    }),

    price: z.number({ error: 'price must be a number' }).nonnegative('price cannot be negative').optional(),

    initialPlaytime: z
        .number({ error: 'initialPlaytime must be a number' })
        .nonnegative('initialPlaytime cannot be negative')
        .optional(),
});

export const createBeatEventSchema = z.object({
    action: z.enum(BEAT_ACTIONS, {
        error: () => ({ message: `action must be one of: ${BEAT_ACTIONS.join(', ')}` }),
    }),

    platformId: z.string().trim().min(1, 'platformId cannot be empty'),

    precision: z.enum(DATE_PRECISIONS, {
        error: () => ({ message: `precision must be one of: ${DATE_PRECISIONS.join(', ')}` }),
    }),

    dateInput: z.string().trim().min(1, 'dateInput cannot be empty'),

    hourInput: z.string().nullable().optional(),

    timeToEvent: z
        .number({ error: 'timeToEvent must be a number' })
        .nonnegative('timeToEvent cannot be negative')
        .nullable()
        .optional(),

    initialPlaytime: z
        .number({ error: 'initialPlaytime must be a number' })
        .nonnegative('initialPlaytime cannot be negative')
        .nullable()
        .optional(),
});

const scoreSchema = z
    .number({ error: 'Score must be a number' })
    .min(0, 'Score cannot be less than 0')
    .max(10, 'Score cannot be more than 10');

export const createRatingSchema = z.object({
    difficulty: z.enum(GAME_DIFFICULTIES, {
        error: `difficulty must be one of: ${GAME_DIFFICULTIES.join(', ')}`,
    }),

    scores: z.object(
        {
            gameplay: scoreSchema,
            graphics: scoreSchema,
            story: scoreSchema,
            sound: scoreSchema,
        },
        { error: 'scores object is required' }
    ),

    comment: z.string().max(1000, 'That review is too long — keep it under 1000 characters!').optional(),

    favorite: z.boolean({ error: 'favorite is required' }),
});

export const getUserGamesQuerySchema = z.object({
    id: z.string().optional(),
    gameId: z.string().optional(),

    favorite: z
        .enum(['true', 'false'], {
            error: 'favorite must be \'true\' or \'false\'',
        })
        .optional(),

    status: z
        .enum(GAME_STATUSES, {
            error: `status must be one of: ${GAME_STATUSES.join(', ')}`,
        })
        .optional(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateUserGameBody = z.infer<typeof createUserGameSchema>;
export type CreateBeatEventBody = z.infer<typeof createBeatEventSchema>;
export type CreateRatingBody = z.infer<typeof createRatingSchema>;
export type GetUserGamesQuery = z.infer<typeof getUserGamesQuerySchema>;
