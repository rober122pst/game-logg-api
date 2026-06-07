import { z } from 'zod';
import type { Prisma, UserGame } from '../../generated/prisma/client.ts';
import type { DatePrecision, GameStatus } from '../../generated/prisma/enums.ts';

import { prisma } from '../prisma.ts';
import type { createBeatEventSchema, createRatingSchema, createUserGameSchema } from './userGamesValidation.ts';

type AddGameEvent = z.infer<typeof createBeatEventSchema>;

export type AddUserGame = z.infer<typeof createUserGameSchema>;

export async function createUserGameService(userId: string, ug: AddUserGame) {
    const userGame = await prisma.userGame.create({
        data: {
            user: {
                connect: { id: userId },
            },
            game: {
                connect: { id: ug.gameId },
            },
            objective: ug.objective,
            status: ug.status,
            initialPlaytime: ug.initialPlaytime ? ug.initialPlaytime * 60 : 0,
            price: ug.price ?? null,
        },
    });

    return userGame;
}

export async function addBeatEvent(ug: UserGame, eventsBody: AddGameEvent, tx: Prisma.TransactionClient = prisma) {
    const currentBeatEvents = await tx.beatEvents.count({
        where: { userGameId: ug.id },
    });

    const playedPlatform = await tx.playedPlatform.upsert({
        where: { userId_platformId: { userId: ug.userId, platformId: eventsBody.platformId } },
        update: {
            totalMinutes: {
                increment: eventsBody.timeToEvent ? eventsBody.timeToEvent * 60 : 0,
            },
        },
        create: {
            user: { connect: { id: ug.userId } },
            platform: { connect: { id: eventsBody.platformId } },
            totalMinutes: eventsBody.timeToEvent ? eventsBody.timeToEvent * 60 : 0,
        },
    });

    const beatEvents: Prisma.BeatEventsCreateManyInput | Prisma.BeatEventsCreateManyInput[] = [];
    if (ug.status !== 'PLAYING' && ug.status !== 'DROPPED') {
        const { occurrenceAtStart, occurrenceAtEnd } = getOccurrenceRange(
            eventsBody.dateInput,
            eventsBody.hourInput ?? '',
            eventsBody.precision
        );

        beatEvents.push({
            action: eventsBody.action,
            occurredAtStart: occurrenceAtStart,
            occurredAtEnd: occurrenceAtEnd,
            precision: eventsBody.precision,
            timeToEvent: eventsBody.timeToEvent ? eventsBody.timeToEvent * 60 : 0,
            platformId: playedPlatform.id,
            userGameId: ug.id,
        });

        if (currentBeatEvents < 1) {
            if (ug.status === 'COMPLETED' || ug.status === 'PLATINUM' || ug.status === 'PERFECT') {
                beatEvents.push({
                    action: 'BEATED',
                    occurredAtStart: occurrenceAtStart,
                    occurredAtEnd: occurrenceAtEnd,
                    precision: eventsBody.precision,
                    timeToEvent: 0,
                    platformId: playedPlatform.id,
                    userGameId: ug.id,
                });

                if (ug.status === 'PERFECT') {
                    beatEvents.push({
                        action: 'PLATINUM',
                        occurredAtStart: occurrenceAtStart,
                        occurredAtEnd: occurrenceAtEnd,
                        precision: eventsBody.precision,
                        timeToEvent: 0,
                        platformId: playedPlatform.id,
                        userGameId: ug.id,
                    });
                }
            }
        }
    }

    const actions = {
        BEATED: 1,
        COMPLETED: 2,
        PLATINUM: 3,
        PERFECT: 4,
    };

    let newStatus: GameStatus = 'BEATED';

    if (ug.status === 'PLAYING' || ug.status === 'DROPPED' || ug.status === 'I_WILL_PLAY') {
        newStatus = ug.status;
    } else if (actions[eventsBody.action] > actions[ug.status as keyof typeof actions]) {
        newStatus = eventsBody.action;
    }

    await tx.userGame.update({
        where: {
            userId_gameId: { userId: ug.userId, gameId: ug.gameId },
        },
        data: {
            status: newStatus,
            playedPlatforms: {
                connect: { id: playedPlatform.id },
            },
        },
    });

    const events = await tx.beatEvents.createMany({
        data: beatEvents,
    });

    return events;
}

type RatingInput = z.infer<typeof createRatingSchema>;
interface RatingBody extends RatingInput {
    userGameId: string;
}

export async function ratingGame({ userGameId, difficulty, scores, comment, favorite }: RatingBody) {
    const rating = await prisma.userRating.create({
        data: {
            gameplay: scores.gameplay,
            graphics: scores.graphics,
            sound: scores.sound,
            story: scores.story,
            comment: comment ?? null,
            favorite,
            difficulty,
            userGame: {
                connect: {
                    id: userGameId,
                },
            },
        },
    });

    return rating;
}

export interface OccurrenceRange {
    occurrenceAtStart: Date;
    occurrenceAtEnd: Date;
}

/**
 * Retorna o início e o fim de um período baseado em uma data e precisão.
 * @param dateString - Data no formato 'aaaa', 'mm/aaaa' ou 'dd/mm/aaaa'
 * @param timeString - Hora no formato 'HH:mm' (Opcional, default '00:00')
 * @param precision - Nível de precisão desejado ('Hora', 'Dia', 'Mes', 'Ano')
 */
export function getOccurrenceRange(
    dateString: string,
    timeString: string = '00:00',
    precision: DatePrecision
): OccurrenceRange {
    // 1. Tratamento da String de Data
    const dateParts = dateString.split('/');
    let day = 1;
    let month = 0; // Janeiro é 0 no Date do JS
    let year = new Date().getFullYear(); // Fallback de segurança

    if (dateParts.length === 1) {
        // Formato: 'aaaa'
        year = parseInt(dateParts[0] ?? '0', 10);
    } else if (dateParts.length === 2) {
        // Formato: 'mm/aaaa'
        month = parseInt(dateParts[0] ?? '0', 10) - 1;
        year = parseInt(dateParts[1] ?? '0', 10);
    } else if (dateParts.length === 3) {
        // Formato: 'dd/mm/aaaa'
        day = parseInt(dateParts[0] ?? '0', 10);
        month = parseInt(dateParts[1] ?? '0', 10) - 1;
        year = parseInt(dateParts[2] ?? '0', 10);
    }

    // 2. Tratamento da String de Hora
    let hours = 0;
    let minutes = 0;

    if (timeString) {
        const timeParts = timeString.split(':');
        hours = parseInt(timeParts[0] || '0', 10);
        minutes = parseInt(timeParts[1] || '0', 10);
    }

    let occurrenceAtStart: Date;
    let occurrenceAtEnd: Date;

    // 3. Cálculo de acordo com a Precisão
    switch (precision) {
        case 'YEAR':
            // Do primeiro segundo de 1º de Janeiro até o último segundo de 31 de Dezembro
            occurrenceAtStart = new Date(year, 0, 1, 0, 0, 0, 0);
            occurrenceAtEnd = new Date(year, 11, 31, 23, 59, 59, 999);
            break;

        case 'MONTH':
            // Passar '0' no dia do próximo mês retorna o último dia do mês atual
            occurrenceAtStart = new Date(year, month, 1, 0, 0, 0, 0);
            occurrenceAtEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
            break;

        case 'DAY':
            // Do primeiro ao último segundo do dia específico
            occurrenceAtStart = new Date(year, month, day, 0, 0, 0, 0);
            occurrenceAtEnd = new Date(year, month, day, 23, 59, 59, 999);
            break;

        case 'HOUR':
        default:
            // Presume-se que engloba o minuto exato recebido na hora
            occurrenceAtStart = new Date(year, month, day, hours, minutes, 0, 0);
            occurrenceAtEnd = new Date(year, month, day, hours, minutes, 59, 999);
            break;
    }

    return { occurrenceAtStart, occurrenceAtEnd };
}
