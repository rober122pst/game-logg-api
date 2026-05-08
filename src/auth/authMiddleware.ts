import type { NextFunction, Request, Response } from 'express';

import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.ts';

//                  Middleware JWT
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const token = req.cookies.token;
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
        if (!token) return res.sendStatus(401).json({ message: 'Access denied' });

        const decode = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { id: string };
        const user = await prisma.user.findUnique({
            where: { id: decode.id },
            select: {
                id: true,
                username: true,
                role: true,
            },
        });

        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        return res.sendStatus(401).json({ message: 'Access denied' });
    }
};
