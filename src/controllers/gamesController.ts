import type { Request, Response } from "express";
import Game from "../models/Games.ts";
export const createGame = async (req: Request, res: Response) => {
    try {
        const game = new Game(req.body);
        await game.save();
        res.status(201).json(game);
    } catch (error: Error | any) {
        res.status(400).json({ message: error.message });
    }
};

export const getGames = async (req: Request, res: Response) => {
    try {
        const games = await Game.find();
        res.status(200).json(games);
    } catch (error: Error | any) {
        res.status(500).json({ message: error.message });
    }
};

export const getGameById = async (req: Request, res: Response) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ message: "Game not found" });
        res.json(game);
    } catch (error: Error | any) {
        res.status(500).json({ message: error.message });
    }
}; 