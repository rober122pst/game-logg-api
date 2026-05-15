import authRoutes from '../auth/authRoutes.ts';
import express from 'express';
import gamesRoutes from './gamesRoutes.ts';
import userGamesRoutes from './userGamesRoutes.ts';
import userRoutes from './userRoutes.ts';
import userStatsRoutes from './userStatsRoutes.ts';
import { validateId } from '../middlewares/validateId.ts';

const routes = express.Router();

routes.use('/auth', authRoutes);
routes.use('/games', gamesRoutes);
routes.use('/users', userRoutes);
routes.use('/users/:userId/stats', validateId('userId'), userStatsRoutes);
routes.use('/users/:userId/games', validateId('userId'), userGamesRoutes);

export default routes;
