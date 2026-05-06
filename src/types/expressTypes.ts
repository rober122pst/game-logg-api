import "express";

declare module "express-serve-static-core" {
    interface Request {
        validateId?: string;
        userId?: string;
    }
}

export interface MyQuery {
    gameId?: string;
    favorite?: string;
}