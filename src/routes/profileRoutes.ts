import express from 'express';
import { authenticateToken } from '../auth/authMiddleware.ts';
import * as profileController from '../controllers/profileController.ts';

const routes = express.Router();

routes.use(authenticateToken);

routes.get('', profileController.getProfileData);

export default routes;
