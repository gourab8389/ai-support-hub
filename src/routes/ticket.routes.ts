import { Hono } from 'hono';
import { ticketController } from '@/controllers/ticket.controller';
import { apiKeyAuth, authMiddleware } from '@/middlewares/auth';
import { validate } from '@/middlewares/validator';
import { createTicketSchema, updateTicketSchema, addMessageSchema } from '@/schemas/ticket.schema';
import { loadWorkspace, requireWorkspaceMember } from '@/middlewares/workspace';

export const ticketRoutes = new Hono();

// Public endpoint (with API key)
ticketRoutes.post('/', apiKeyAuth, validate(createTicketSchema), (c) => ticketController.create(c));

// Protected endpoints
ticketRoutes.use('/:workspaceId', authMiddleware, loadWorkspace, requireWorkspaceMember());
ticketRoutes.use('/:workspaceId/*', authMiddleware, loadWorkspace, requireWorkspaceMember());

ticketRoutes.get('/:workspaceId', (c) =>
  ticketController.list(c)
);

ticketRoutes.get('/:workspaceId/:ticketId', (c) =>
  ticketController.get(c)
);

ticketRoutes.patch('/:workspaceId/:ticketId', validate(updateTicketSchema), (c) =>
  ticketController.update(c)
);

ticketRoutes.post('/:workspaceId/:ticketId/messages', validate(addMessageSchema), (c) =>
  ticketController.addMessage(c)
);
