// // routes/userStatsRoutes.js

import express from 'express';
import { getProfileStats } from '../controllers/userStatsController.ts';

const router = express.Router();

router.get('/', getProfileStats); // estatísticas do usuário
// router.post('/hours', addHours); // adicionar horas
// router.post('/completed-game', addCompletedGame); // adicionar jogo zerado

export default router;
