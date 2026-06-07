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
            timeToEvent: true,
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
            const timeToEvent = event.timeToEvent ?? 0;
            // Verifica se o tempo do evento ultrapassa o tempo inicial já registrado
            if (timeToEvent > initialPlaytime) {
                const delta = timeToEvent - initialPlaytime;

                acc.push({
                    ...event,
                    timeToEvent,
                    delta: delta,
                });
            }
            // Se for menor ou igual, simplesmente não adicionamos ao array final (é ignorado)

            return acc;
        },
        [] as Array<{ id: string; timeToEvent: number; userGameId: string; delta: number }>
    );

    // 5. (Opcional) Se você precisar do tempo extra total jogado nos eventos:
    const totalDeltaTime = eventsWithDeltas.reduce((sum, event) => sum + event.delta, 0);
    return totalDeltaTime + (totalInitialTime._sum.initialPlaytime ?? 0);
}

export async function getGenreStats(userId: string) {
    const userGames = await prisma.userGame.findMany({
        where: { userId: userId, status: { notIn: ['I_WILL_PLAY'] } },
        include: {
            game: {
                select: {
                    genres: true,
                },
            },
        },
    });

    const genreCounts: Record<string, number> = {};
    let totalGenresCount = 0;

    userGames.forEach((userGame) => {
        if (userGame.game && userGame.game.genres) {
            userGame.game.genres.forEach((genre) => {
                // Supondo que a tabela genre tenha um campo 'name'
                const genreName = genre.name;

                genreCounts[genreName] = (genreCounts[genreName] || 0) + 1;
                totalGenresCount++;
            });
        }
    });

    // 4. Calcular a porcentagem e formatar o resultado final
    const genreStats = Object.entries(genreCounts)
        .map(([name, count]) => {
            // Calcula a porcentagem (ex: 25.50)
            const percentage = totalGenresCount > 0 ? (count / totalGenresCount) * 100 : 0;

            return {
                genre: name,
                total: count,
                percentage: percentage, // Converte de volta para número se preferir
            };
        })
        // Opcional: Ordenar do gênero mais frequente para o menos frequente
        .sort((a, b) => b.total - a.total);

    return {
        totalTags: totalGenresCount,
        stats: genreStats,
    };
}
