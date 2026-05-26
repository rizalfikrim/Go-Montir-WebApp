// src/modules/chatbot/chatbot.routes.ts
import { Router } from 'express';
import { handleChat } from './chatbot.controller';

const router = Router();

// Endpoint akan menjadi: /api/chatbot (atau tergantung prefix di app.ts Anda)
router.post('/', handleChat);

export default router;