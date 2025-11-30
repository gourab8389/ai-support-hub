import { z } from 'zod';

export const createKnowledgeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateKnowledgeSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().min(10).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const searchKnowledgeSchema = z.object({
  query: z.string().min(1),
  category: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
});