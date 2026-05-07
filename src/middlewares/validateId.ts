import type { NextFunction, Request, Response } from 'express';

export function validateId(paramName: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const id = req.params[paramName];

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: `Invalid ${paramName}` });
        }

        req.validatedId = id;
        next();
    };
}
