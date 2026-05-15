import * as userGamesController from '../controllers/userGamesController.ts';

import { authenticateToken } from '../auth/authMiddleware.ts';
import express from 'express';
import { privateProfile } from '../middlewares/privateProfile.ts';

const routes = express.Router();

routes.post('/', authenticateToken, userGamesController.createUserGame);
routes.get('/', privateProfile, userGamesController.getUserGames);
// routes.get('/:userId/games/totaltime', userGamesController.getTotalTime);
// routes.get('/:userId/games/lastplayed', userGamesController.getLastPlayedGames);

export default routes;
