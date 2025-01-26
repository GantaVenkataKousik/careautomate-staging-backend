
import express from 'express';
import { createConversation, getConversation, getAllConversations, getPaginatedMessages, sendMessage } from '../controllers/conversationController.js';

const router = express.Router();

router.post('/', createConversation);
router.get('/:id', getConversation);
router.get('/all/:id', getAllConversations);
router.get('/messages/:id', getPaginatedMessages);
router.post('/sendMessage', sendMessage);
export default router;