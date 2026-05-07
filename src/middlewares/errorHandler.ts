import type { Request, Response } from 'express';

export function errorHandler(err: Error, req: Request, res: Response) {
    console.error(err);
    res.status(500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}
