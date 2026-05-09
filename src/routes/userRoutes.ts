import * as userController from '../controllers/userController.ts';

import express from 'express';
import { authenticateToken } from '../auth/authMiddleware.ts';
import { privateProfile } from '../middlewares/privateProfile.ts';
import { validateId } from '../middlewares/validateId.ts';

const routes = express.Router();

routes.get('/me', authenticateToken, userController.getMe);
routes.get('/:id', validateId('id'), privateProfile, userController.getUserById);

export default routes;
