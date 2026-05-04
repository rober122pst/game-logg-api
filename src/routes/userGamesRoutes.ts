import express from 'express';
import * as userGamesController from '../controllers/userGamesController.ts';
const routes = express.Router();

routes.post("/:userId/games", userGamesController.createUserGame);
routes.get("/:userId/games", userGamesController.getUserGames);
routes.get("/:userId/games/totaltime", userGamesController.getTotalTime);
routes.get("/:userId/games/lastplayed", userGamesController.getLastPlayedGames);

export default routes;