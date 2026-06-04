import express from 'express';
import authRoutes from '../auth/authRoutes.ts';
import { validateId } from '../middlewares/validateId.ts';
import gamesRoutes from './gamesRoutes.ts';
import userGamesRoutes from './userGamesRoutes.ts';
import userRoutes from './userRoutes.ts';
import userStatsRoutes from './userStatsRoutes.ts';

const routes = express.Router();

routes.use('/auth', authRoutes);
routes.use('/games', gamesRoutes);
routes.use('/users', userRoutes);
routes.use('/users/me/games', userGamesRoutes);
routes.use('/users/:userId/stats', validateId('userId'), userStatsRoutes);

export default routes;
