import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  industry: z.string().optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  widgetColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  widgetPosition: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional(),
  welcomeMessage: z.string().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'AGENT', 'MEMBER']),
});