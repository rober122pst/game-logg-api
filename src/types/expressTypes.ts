import "express";

declare module "express-serve-static-core" {
    interface Request {
        validateId?: string;
        userId?: string;
    }
}