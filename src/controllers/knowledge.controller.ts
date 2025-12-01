import { Context } from 'hono';
import { prisma } from '@/config/database';
import { successResponse, ApiError } from '@/utils/response';

export class KnowledgeController {
  async create(c: Context) {
    const { workspaceId } = c.req.param();
    const data = c.get('validated');

    const knowledge = await prisma.knowledgeBase.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags || [],
        workspaceId,
      },
    });

    return successResponse(c, { knowledge }, 'Knowledge created successfully', 201);
  }

  async list(c: Context) {
    const { workspaceId } = c.req.param();
    const { category, page = '1', limit = '20' } = c.req.query();

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = { workspaceId };

    if (category) where.category = category;

    const [items, total] = await Promise.all([
      prisma.knowledgeBase.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.knowledgeBase.count({ where }),
    ]);

    return successResponse(c, {
      items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  }

  async get(c: Context) {
    const { id } = c.req.param();

    const knowledge = await prisma.knowledgeBase.findUnique({
      where: { id },
    });

    if (!knowledge) {
      throw new ApiError('Knowledge article not found', 404);
    }

    return successResponse(c, { knowledge });
  }

  async update(c: Context) {
    const { id } = c.req.param();
    const data = c.get('validated');

    const knowledge = await prisma.knowledgeBase.update({
      where: { id },
      data,
    });

    return successResponse(c, { knowledge }, 'Knowledge updated successfully');
  }

  async delete(c: Context) {
    const { id } = c.req.param();

    await prisma.knowledgeBase.delete({
      where: { id },
    });

    return successResponse(c, {}, 'Knowledge deleted successfully');
  }
}

export const knowledgeController = new KnowledgeController();