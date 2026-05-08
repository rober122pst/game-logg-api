import type { Request, Response } from 'express';

import { generateToken } from './tokenService.ts';

export const googleAuth = (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = generateToken(req.user);
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.redirect(`${process.env.CLIENT_URL}/`);
};
