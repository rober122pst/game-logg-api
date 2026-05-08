import type { NextFunction, Request, Response } from 'express';

import { prisma } from '../prisma.ts';

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await prisma.user.create({
            data: req.body,
        });
        res.status(201).json({ message: 'User created successfully', userId: user.id });
    } catch (error) {
        next(error);
    }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.validatedId) return res.status(400).json({ message: 'Invalid user ID' });
        const user = await prisma.user.findUnique({
            where: { id: req.validatedId },
            select: {
                id: true,
                username: true,
                profile: true,
                library: true,
                createdAt: true,
            },
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        return res.json(user);
    } catch (err) {
        next(err);
    }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                profile: true,
                library: true,
                createdAt: true,
            },
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (error) {
        next(error);
    }
};
// export const checkEmailExists = async (req: Request, res: Response) => {
//     try {
//         const { email } = req.body;

//         if (!email) {
//             return res.status(400).json({ message: "Email é obrigatório." });
//         }

//         const user = await User.findOne({ email });

//         if (user) {
//             return res.status(200).json({ exists: true, message: "Email já cadastrado." });
//         } else {
//             return res.status(200).json({ exists: false, message: "Verified" });
//         }
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ message: "Erro no servidor." });
//     }
// };
