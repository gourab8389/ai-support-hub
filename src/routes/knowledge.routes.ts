import { Hono } from 'hono';
import { knowledgeController } from '@/controllers/knowledge.controller';
import { authMiddleware } from '@/middlewares/auth';
import { validate } from '@/middlewares/validator';
import { createKnowledgeSchema, updateKnowledgeSchema } from '@/schemas/knowledge.schema';

const knowledgeRoutes = new Hono();

knowledgeRoutes.use('/*', authMiddleware);

knowledgeRoutes.post(
  '/:workspaceId',
  validate(createKnowledgeSchema),
  (c) => knowledgeController.create(c)
);

knowledgeRoutes.get('/:workspaceId', (c) => knowledgeController.list(c));
knowledgeRoutes.get('/:workspaceId/:id', (c) => knowledgeController.get(c));
knowledgeRoutes.patch(
  '/:workspaceId/:id',
  validate(updateKnowledgeSchema),
  (c) => knowledgeController.update(c)
);
knowledgeRoutes.delete('/:workspaceId/:id', (c) => knowledgeController.delete(c));

export default knowledgeRoutes;