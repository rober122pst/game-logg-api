import 'express';

import type { GameStatus, User as PrismaUser } from '../../generated/prisma/client.ts';

declare module 'express-serve-static-core' {
    interface Request {
        validatedId?: string;
        userId?: string;
        user: Pick<PrismaUser, 'id' | 'username' | 'role'> | null;
    }

    interface User extends PrismaUser {
        id: string;
    }
}

export interface MyQuery {
    gameId?: string;
    favorite?: string;
    status?: GameStatus;
}
