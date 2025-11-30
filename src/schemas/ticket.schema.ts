import { z } from 'zod';

export const createTicketSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

export const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().optional(),
});

export const addMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  isInternal: z.boolean().optional(),
});