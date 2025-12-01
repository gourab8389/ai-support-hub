import { Hono } from 'hono';
import { ticketController } from '@/controllers/ticket.controller';
import { apiKeyAuth, authMiddleware } from '@/middlewares/auth';
import { validate } from '@/middlewares/validator';
import { createTicketSchema, updateTicketSchema, addMessageSchema } from '@/schemas/ticket.schema';
import { loadWorkspace } from '@/middlewares/workspace';

export const ticketRoutes = new Hono();

// Public endpoint (with API key)
ticketRoutes.post('/', apiKeyAuth, validate(createTicketSchema), (c) => ticketController.create(c));

// Protected endpoints
ticketRoutes.use('/:workspaceId/*', authMiddleware, loadWorkspace);

ticketRoutes.get('/:workspaceId', authMiddleware, loadWorkspace, (c) =>
  ticketController.list(c)
);

ticketRoutes.get('/:workspaceId/:ticketId', authMiddleware, loadWorkspace, (c) =>
  ticketController.get(c)
);

ticketRoutes.patch('/:workspaceId/:ticketId', authMiddleware, loadWorkspace, validate(updateTicketSchema), (c) =>
  ticketController.update(c)
);

ticketRoutes.post('/:workspaceId/:ticketId/messages', authMiddleware, loadWorkspace, validate(addMessageSchema), (c) =>
  ticketController.addMessage(c)
);
