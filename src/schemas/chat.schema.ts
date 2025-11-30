import { z } from 'zod';

export const chatQuerySchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  ticketId: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
  customerId: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
});