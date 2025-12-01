import { Hono } from 'hono';
import { workspaceController } from '@/controllers/workspace.controller';
import { authMiddleware } from '@/middlewares/auth';
import { validate } from '@/middlewares/validator';
import { createWorkspaceSchema, updateWorkspaceSchema } from '@/schemas/workspace.schema';

export const workspaceRoutes = new Hono();

workspaceRoutes.use('/*', authMiddleware);

workspaceRoutes.post('/', validate(createWorkspaceSchema), (c) => workspaceController.create(c));
workspaceRoutes.get('/', (c) => workspaceController.list(c));
workspaceRoutes.get('/:workspaceId', (c) => workspaceController.get(c));
workspaceRoutes.patch('/:workspaceId', validate(updateWorkspaceSchema), (c) => workspaceController.update(c));
workspaceRoutes.delete('/:workspaceId', (c) => workspaceController.delete(c));
workspaceRoutes.post('/:workspaceId/api-keys', (c) => workspaceController.generateApiKey(c));