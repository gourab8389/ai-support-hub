import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { corsMiddleware } from './middlewares/cors';
import { errorHandler } from './middlewares/errorHandler';
import { rateLimit } from './middlewares/rateLimit';
import { authRoutes } from './routes/auth.routes';
import { workspaceRoutes } from './routes/workspace.routes';
import { ticketRoutes } from './routes/ticket.routes';
import { chatRoutes } from './routes/chat.routes';
import knowledgeRoutes from './routes/knowledge.routes';

const app = new Hono();

// Global middlewares
app.use('*', logger());
app.use('*', corsMiddleware);
app.use('*', prettyJSON());
app.use('/api/*', rateLimit());

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/workspaces', workspaceRoutes);
app.route('/api/tickets', ticketRoutes);
app.route('/api/chat', chatRoutes);
app.route('/api/knowledge', knowledgeRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, message: 'Route not found' }, 404);
});

// Error handler
app.onError(errorHandler);

export default app;