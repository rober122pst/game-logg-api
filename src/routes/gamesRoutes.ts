import express from 'express';
import { authenticateToken } from '../auth/authMiddleware.ts';
import * as gamesController from '../controllers/gamesController.ts';
import { validateId } from '../middlewares/validateId.ts';

const routes = express.Router();

routes.post('/', authenticateToken, gamesController.createGame);
routes.get('/', gamesController.getGames);
routes.get('/:id', validateId('id'), gamesController.getGameById);

export default routes;
