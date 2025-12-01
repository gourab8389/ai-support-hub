import { Context } from 'hono';
import { prisma } from '@/config/database';
import { successResponse, ApiError } from '@/utils/response';
import { nanoid } from 'nanoid';

export class WorkspaceController {
  async create(c: Context) {
    const user = c.get('user');
    const { name, slug, description, industry } = c.get('validated');

    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (existingWorkspace) {
      throw new ApiError('Workspace slug already exists', 409);
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        description,
        industry,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
      },
    });

    return successResponse(c, { workspace }, 'Workspace created successfully', 201);
  }

  async list(c: Context) {
    const user = c.get('user');

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId: user.id },
        },
      },
      include: {
        members: {
          where: { userId: user.id },
          select: { role: true },
        },
        _count: {
          select: { tickets: true, knowledgeBase: true, members: true },
        },
      },
    });

    return successResponse(c, { workspaces }, 'Workspaces retrieved successfully');
  }

  async get(c: Context) {
    const { workspaceId } = c.req.param();
    const user = c.get('user');

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: { userId: user.id },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        _count: {
          select: { tickets: true, knowledgeBase: true },
        },
      },
    });

    if (!workspace) {
      throw new ApiError('Workspace not found', 404);
    }

    return successResponse(c, { workspace }, 'Workspace retrieved successfully');
  }

  async update(c: Context) {
    const { workspaceId } = c.req.param();
    const user = c.get('user');
    const data = c.get('validated');

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!member) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data,
    });

    return successResponse(c, { workspace }, 'Workspace updated successfully');
  }

  async delete(c: Context) {
    const { workspaceId } = c.req.param();
    const user = c.get('user');

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
        role: 'OWNER',
      },
    });

    if (!member) {
      throw new ApiError('Only workspace owners can delete workspaces', 403);
    }

    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return successResponse(c, {}, 'Workspace deleted successfully');
  }

  async generateApiKey(c: Context) {
    const { workspaceId } = c.req.param();
    const user = c.get('user');
    const { name } = await c.req.json();

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!member) {
      throw new ApiError('Insufficient permissions', 403);
    }

    const key = `sk_${nanoid(32)}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key,
        userId: user.id,
        workspaceId,
      },
    });

    return successResponse(c, { apiKey }, 'API key generated successfully', 201);
  }
}

export const workspaceController = new WorkspaceController();