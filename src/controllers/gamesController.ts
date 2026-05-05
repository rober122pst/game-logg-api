import type { Request, Response } from "express";
import { prisma } from "../prisma.ts";

export const createGame = async (req: Request, res: Response) => {
    try {
        const game = await prisma.game.create({
            data: req.body
        });

        res.status(201).json(game);
    } catch (error: Error | any) {
        res.status(400).json({ message: error.message });
    }
};

export const getGames = async (req: Request, res: Response) => {
    try {
        const games = await prisma.game.findMany();
        res.status(200).json(games);
    } catch (error: Error | any) {
        res.status(500).json({ message: error.message });
    }
};

export const getGameById = async (req: Request, res: Response) => {
    try {
        if (!req.validateId) return res.status(400).json({ message: "Invalid game id" });

        const game = await prisma.game.findUnique({
            where: { id: req.validateId }
        });
        if (!game) return res.status(404).json({ message: "Game not found" });
        res.json(game);
    } catch (error: Error | any) {
        res.status(500).json({ message: error.message });
    }
}; 