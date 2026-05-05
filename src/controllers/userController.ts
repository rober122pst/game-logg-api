import type { Request, Response } from "express";
import { prisma } from "../prisma.ts";

export const createUser = async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.create({
            data: req.body
        });
        res.status(201).json({ message: "User created successfully", userId: user.id });
    } catch (error: Error | any) {
        res.status(400).json({ message: error.message });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany();
        res.status(200).json(users);
    } catch (error: Error | any) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        // -password -email => não retornam do banco
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                profile: true,
                createdAt: true,
            }
        })

        if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

        return res.json(user);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro no servidor' });
    }
};

export const getMe = async (req: Request & { user?: { _id?: string; name?: string; profile?: any } }, res: Response) => {
    if (req.user) {
        res.json({
            id: req.user._id,
            name: req.user.name,
            profile: req.user.profile
        });
    } else {
        return res.status(401).json({ message: 'Usuário não autenticado' });
    }
}
export const checkEmailExists = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email é obrigatório." });
        }

        const user = await User.findOne({ email });

        if (user) {
            return res.status(200).json({ exists: true, message: "Email já cadastrado." });
        } else {
            return res.status(200).json({ exists: false, message: "Verified" });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Erro no servidor." });
    }
};
