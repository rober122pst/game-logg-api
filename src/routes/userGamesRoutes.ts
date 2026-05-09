import express from 'express';
import { authenticateToken } from '../auth/authMiddleware.ts';
import * as userGamesController from '../controllers/userGamesController.ts';
import { privateProfile } from '../middlewares/privateProfile.ts';
const routes = express.Router();

routes.post('/:userId/games', authenticateToken, userGamesController.createUserGame);
routes.get('/:userId/games', privateProfile, userGamesController.getUserGames);
// routes.get('/:userId/games/totaltime', userGamesController.getTotalTime);
// routes.get('/:userId/games/lastplayed', userGamesController.getLastPlayedGames);

export default routes;
