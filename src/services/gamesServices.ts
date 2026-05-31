import apicalypse from 'apicalypse';
import { prisma } from '../prisma.ts';
import { requestOptions } from '../utils/requestOptions.ts';

export type IGDBGame = {
    id: number;
    slug: string;
    name: string;
    alternative_names: { name: string }[];
    platforms: { slug: string; name: string }[];
    first_release_date: number;
    genres: { slug: string; name: string }[];
    cover: { image_id: number };
    screenshots: { image_id: number }[];
    storyline: string;
    rating: number;
};

export async function createGameWithIGDB(igdbId: number) {
    const igdbResponse = await apicalypse(requestOptions)
        .fields(
            'slug,name,alternative_names.name,platforms.slug,platforms.name,first_release_date,genres.slug,genres.name,cover.image_id,screenshots.image_id,storyline,rating'
        )
        .where(`id = ${igdbId}`)
        .request('/games');

    if (!igdbResponse.data) return { data: { message: 'Game not found in IGDB' }, status: 404 };

    const igdbGame = igdbResponse.data[0] as IGDBGame;

    const gameArtworksResponse = await apicalypse(requestOptions)
        .fields('image_id, artwork_type')
        .where(`game = ${igdbGame.id} & (artwork_type = 2 | artwork_type = 1 | artwork_type = 3)`)
        .request('/artworks');

    const preferredTypes = [2, 3, 1]; // Prioridade: 2 (banner sem logo), 3 (banner com logo), 1 (capa ou artwork)
    const getArtworkImageId = () => {
        if (!gameArtworksResponse.data || gameArtworksResponse.data.length === 0) return null;

        const sortedArtworks = gameArtworksResponse.data.sort(
            (a: { artwork_type: number }, b: { artwork_type: number }) => {
                const typeA = preferredTypes.indexOf(a.artwork_type);
                const typeB = preferredTypes.indexOf(b.artwork_type);
                return typeA - typeB; // Ordena pela prioridade definida
            }
        );

        return sortedArtworks[0].image_id; // Retorna o image_id do artwork com maior prioridade
    };

    const artworkImageId = getArtworkImageId();

    const platforms = await Promise.all(
        igdbGame.platforms.map(async (p) =>
            prisma.platform.upsert({
                where: { slug: p.slug },
                update: { name: p.name },
                create: { slug: p.slug, name: p.name },
            })
        )
    );

    const genres = await Promise.all(
        igdbGame.genres.map(async (g) =>
            prisma.genre.upsert({
                where: { slug: g.slug },
                update: { name: g.name },
                create: { slug: g.slug, name: g.name },
            })
        )
    );

    const game = await prisma.game.create({
        data: {
            slug: igdbGame.slug,
            title: igdbGame.name,
            alternativeTitles: igdbGame.alternative_names
                ? igdbGame.alternative_names.map((n) => n.name).filter(Boolean)
                : [],
            releaseDate: new Date(igdbGame.first_release_date * 1000),
            coverUrl: igdbGame.cover.image_id
                ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${igdbGame.cover.image_id}.jpg`
                : null,
            bannerUrl: artworkImageId
                ? `https://images.igdb.com/igdb/image/upload/t_1080p/${artworkImageId}.jpg`
                : null,
            screenshots: igdbGame.screenshots.map(
                (s) => `https://images.igdb.com/igdb/image/upload/t_screenshot_huge/${s.image_id}.jpg`
            ),
            description: igdbGame.storyline,
            igdbId: igdbGame.id,
            steamId: igdbGame.slug,
            preferedSource: 'igdb',
            ratings: [
                {
                    name: 'IGDB',
                    score: igdbGame.rating,
                },
            ],

            platforms: {
                connect: platforms.map((p) => ({ slug: p.slug })),
            },
            genres: {
                connect: genres.map((g) => ({ slug: g.slug })),
            },
        },
        include: {
            platforms: true,
            genres: true,
        },
    });
    return {
        data: {
            message: 'Game created successfully',
            game,
        },
        status: 201,
    };
}
