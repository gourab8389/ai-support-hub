import { Context } from 'hono';
import { prisma } from '@/config/database';
import { successResponse, ApiError } from '@/utils/response';
import { geminiService } from '@/services/gemini.service';
import { logger } from '@/utils/logger';

export class KnowledgeController {
  async create(c: Context) {
    const workspace = c.get('workspace');
    const data = c.get('validated');

    let embedding: string | null = null;

    try {
      embedding = await geminiService.generateKnowledgeEmbedding({
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags || [],
      });
    } catch (error) {
      logger.warn('Failed to generate embedding during knowledge creation', error);
    }

    const knowledge = await prisma.knowledgeBase.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags || [],
        embedding,
        workspaceId: workspace.id,
      },
    });

    return successResponse(c, { knowledge }, 'Knowledge created successfully', 201);
  }

  async list(c: Context) {
    const workspace = c.get('workspace');
    const { category, page = '1', limit = '20' } = c.req.query();

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = { workspaceId: workspace.id };

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
    const workspace = c.get('workspace');
    const { id } = c.req.param();

    const knowledge = await prisma.knowledgeBase.findFirst({
      where: {
        id,
        workspaceId: workspace.id,
      },
    });

    if (!knowledge) {
      throw new ApiError('Knowledge article not found', 404);
    }

    return successResponse(c, { knowledge });
  }

  async update(c: Context) {
    const workspace = c.get('workspace');
    const { id } = c.req.param();
    const data = c.get('validated');

    const existingKnowledge = await prisma.knowledgeBase.findFirst({
      where: {
        id,
        workspaceId: workspace.id,
      },
    });

    if (!existingKnowledge) {
      throw new ApiError('Knowledge article not found', 404);
    }

    let embedding = existingKnowledge.embedding;
    const shouldRegenerateEmbedding =
      typeof data.title !== 'undefined' ||
      typeof data.content !== 'undefined' ||
      typeof data.category !== 'undefined' ||
      typeof data.tags !== 'undefined';

    if (shouldRegenerateEmbedding) {
      try {
        embedding = await geminiService.generateKnowledgeEmbedding({
          title: data.title ?? existingKnowledge.title,
          content: data.content ?? existingKnowledge.content,
          category: data.category ?? existingKnowledge.category,
          tags: data.tags ?? existingKnowledge.tags,
        });
      } catch (error) {
        logger.warn('Failed to regenerate embedding during knowledge update', error);
      }
    }

    const knowledge = await prisma.knowledgeBase.update({
      where: { id: existingKnowledge.id },
      data: {
        ...data,
        embedding,
      },
    });

    return successResponse(c, { knowledge }, 'Knowledge updated successfully');
  }

  async delete(c: Context) {
    const workspace = c.get('workspace');
    const { id } = c.req.param();

    const knowledge = await prisma.knowledgeBase.findFirst({
      where: {
        id,
        workspaceId: workspace.id,
      },
    });

    if (!knowledge) {
      throw new ApiError('Knowledge article not found', 404);
    }

    await prisma.knowledgeBase.delete({
      where: { id: knowledge.id },
    });

    return successResponse(c, {}, 'Knowledge deleted successfully');
  }
}

export const knowledgeController = new KnowledgeController();
