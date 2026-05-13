import type { NextFunction, Request, Response } from 'express';

import bcrypt from 'bcrypt';
import { generateToken } from './tokenService.ts';
import { prisma } from '../prisma.ts';

//                    Registro via Email
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'Name, email and password are required' });

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'Email already registered' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                username: name,
                email,
                password: passwordHash,
                profile: {
                    create: {
                        displayName: name,
                    },
                },
            },
        });

        const token = generateToken(user);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        return res.status(200).json({
            message: 'Register successful.',
            token,
            id: user.id,
            name: user.username,
        });
    } catch (err) {
        next(err);
    }
};

//                 Login via Email
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return res.status(400).json({ message: 'Email or password is incorrect' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Email or password is incorrect' });

        const token = generateToken(user);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        return res.status(200).json({
            message: 'Login successful.',
            token,
            id: user.id,
            name: user.username,
        });
    } catch (err) {
        next(err);
    }
};
