import express from 'express';
import { authenticateToken } from '../auth/authMiddleware.js';
import * as userController from '../controllers/userController.ts';
const routes = express.Router();


routes.get("/", userController.getUsers);
routes.get("/me", authenticateToken, userController.getMe)
routes.get("/:id", userController.getUserById);

export default routes;
