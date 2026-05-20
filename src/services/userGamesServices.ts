import type { UserRatingCreateWithoutUserGameInput } from '../../generated/prisma/models.ts';
import { prisma } from '../prisma.ts';

type UserGameType = {
    id: string;
    status: 'PLAYING' | 'BEATED' | 'PLATINUM' | 'COMPLETED' | 'WISHLIST' | 'DROPPED';
    playtime: number;
    comment?: string;
    favorite: boolean;
    difficulty: 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';
    acquiredAt?: Date;
    gameId: string;
    userId: string;
    platformsIds: string[];
    createdAt: Date;
    updateAt: Date;
};

export async function createUserGameService(data: UserGameType, rating?: UserRatingCreateWithoutUserGameInput) {
    const userGame = await prisma.userGame.create({
        data: {
            user: {
                connect: { id: data.userId },
            },
            game: {
                connect: { id: data.gameId },
            },
            ...(rating && {
                rating: {
                    create: {
                        ...rating,
                    },
                },
            }),
            playtime: data.playtime,
            difficulty: data.difficulty,
            status: data.status,
            comment: data.comment ?? null,
            favorite: data.favorite,
            acquiredAt: data.acquiredAt ?? null,
        },
        include: {
            rating: true,
        },
    });

    return userGame;
}
