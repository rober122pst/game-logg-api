import * as userController from '../controllers/userController.ts';

import express from 'express';
import { authenticateToken } from '../auth/authMiddleware.ts';

const routes = express.Router();

routes.get('/me', authenticateToken, userController.getMe);
routes.get('/:id', userController.getUserById);

export default routes;
