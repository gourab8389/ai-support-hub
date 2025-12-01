import { Hono } from 'hono';
import { chatController } from '@/controllers/chat.controller';
import { apiKeyAuth } from '@/middlewares/auth';
import { validate } from '@/middlewares/validator';
import { chatQuerySchema, } from '@/schemas/chat.schema';
import { searchKnowledgeSchema } from '@/schemas/knowledge.schema';

export const chatRoutes = new Hono();

// Public API endpoints (with API key)
chatRoutes.use('/*', apiKeyAuth);

chatRoutes.post('/query', validate(chatQuerySchema), (c) => chatController.query(c));
chatRoutes.post('/search', validate(searchKnowledgeSchema), (c) => chatController.searchKnowledge(c));