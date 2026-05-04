import express from 'express';
import * as gamesController from '../controllers/gamesController.ts';
const routes = express.Router();

routes.post("/", gamesController.createGame);
routes.get("/", gamesController.getGames);
routes.get("/:id", gamesController.getGameById);

export default routes;
