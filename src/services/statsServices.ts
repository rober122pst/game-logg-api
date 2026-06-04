import { prisma } from '../prisma.ts';

export async function calcTotalTime(userId: string) {
    const totalTime = await prisma.$transaction(async (tx) => {
        const totalInitialTime = await tx.userGame.aggregate({
            where: { userId },
            _sum: { initialPlaytime: true },
        });

        const initialPlaytimes = await tx.userGame.findMany({
            where: { userId },
            select: { id: true, initialPlaytime: true },
        });

        const eventsTimes = await tx.beatEvents;
    });
}
