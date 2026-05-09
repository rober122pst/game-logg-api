import express from 'express';

import authRoutes from '../auth/authRoutes.ts';
import gamesRoutes from './gamesRoutes.ts';
import userGamesRoutes from './userGamesRoutes.ts';
import userRoutes from './userRoutes.ts';

const routes = express.Router();

routes.use('/auth', authRoutes);
routes.use('/games', gamesRoutes);
routes.use('/users', userGamesRoutes);
routes.use('/users', userRoutes);

export default routes;
