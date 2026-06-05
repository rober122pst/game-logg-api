import { prisma } from '../prisma.ts';

export async function calcTotalTime(userId: string) {
    const totalInitialTime = await prisma.userGame.aggregate({
        where: { userId },
        _sum: { initialPlaytime: true },
    });

    const initialPlaytimes = await prisma.userGame.findMany({
        where: { userId },
        select: { id: true, initialPlaytime: true },
    });

    // 2. Buscando os eventos correspondentes aos jogos desse usuário
    const eventsTimes = await prisma.beatEvents.findMany({
        where: {
            userGame: { userId }, // Garante que pega apenas eventos do usuário
        },
        select: {
            id: true,
            timeToBeat: true,
            userGameId: true, // Essencial para cruzar os dados
        },
    });

    // 3. Criando um Map para busca rápida (O(1)) do initialPlaytime de cada jogo
    const initialPlaytimeMap = new Map(initialPlaytimes.map((game) => [game.id, game.initialPlaytime || 0]));

    // 4. Calculando os deltas
    const eventsWithDeltas = eventsTimes.reduce(
        (acc, event) => {
            // Pega o tempo inicial do jogo (ou 0 se não existir)
            const initialPlaytime = initialPlaytimeMap.get(event.userGameId) || 0;

            // Verifica se o tempo do evento ultrapassa o tempo inicial já registrado
            if (event.timeToBeat > initialPlaytime) {
                const delta = event.timeToBeat - initialPlaytime;

                acc.push({
                    ...event,
                    delta: delta,
                });
            }
            // Se for menor ou igual, simplesmente não adicionamos ao array final (é ignorado)

            return acc;
        },
        [] as Array<{ id: string; timeToBeat: number; userGameId: string; delta: number }>
    );

    // 5. (Opcional) Se você precisar do tempo extra total jogado nos eventos:
    const totalDeltaTime = eventsWithDeltas.reduce((sum, event) => sum + event.delta, 0);
    return totalDeltaTime + (totalInitialTime._sum.initialPlaytime ?? 0);
}
