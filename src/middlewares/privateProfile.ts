import type { NextFunction, Request, Response } from 'express';

export function privateProfile(req: Request, res: Response, next: NextFunction) {
    const id = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

    if (id !== req.userId) {
        return res.status(403).json({ message: 'Access denied to this profile' });
    }

    next();
}
