import * as userGamesController from '../controllers/userGamesController.ts';

import express from 'express';
import { authenticateToken } from '../auth/authMiddleware.ts';
import { validateId } from '../middlewares/validateId.ts';

const routes = express.Router();

routes.use(authenticateToken);

routes.post('/', userGamesController.createUserGame);
routes.get('/', userGamesController.getUserGames);
routes.post('/:id/events', validateId('id'), userGamesController.createBeatEvent);
routes.post('/:id/rating', validateId('id'), userGamesController.createRating);
// routes.get('/:userId/games/lastplayed', userGamesController.getLastPlayedGames);

export default routes;
