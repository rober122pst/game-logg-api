import express from 'express';
import * as gamesController from '../controllers/gamesController.ts';
import { validateId } from '../middlewares/validateId.ts';

const routes = express.Router();

routes.get('/', gamesController.getGames);
routes.get('/popular-games', gamesController.getPopularGames);
routes.get('/suggestions', gamesController.getGameSuggestions);
routes.get('/:id', validateId('id'), gamesController.createGame);

export default routes;
