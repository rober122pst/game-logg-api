import 'express';

declare module 'express-serve-static-core' {
    interface Request {
        validatedId?: string;
        userId?: string;
    }

    interface User {
        id?: string;
    }
}

export interface MyQuery {
    gameId?: string;
    favorite?: string;
}
