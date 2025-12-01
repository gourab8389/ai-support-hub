import { Context } from 'hono';
import { prisma } from '@/config/database';
import { successResponse, ApiError } from '@/utils/response';
import { geminiService } from '@/services/gemini.service';
import { emailService } from '@/services/email.service';

export class TicketController {
  async create(c: Context) {
    const workspace = c.get('workspace');
    const data = c.get('validated');

    // Analyze with AI first
    const aiAnalysis = await geminiService.analyzeQuery(
      data.message,
      workspace.id,
      { customerEmail: data.customerEmail, customerName: data.customerName }
    );

    const ticket = await prisma.ticket.create({
      data: {
        subject: data.subject,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerId: data.customerId,
        priority: data.priority || 'MEDIUM',
        workspaceId: workspace.id,
        messages: {
          create: {
            content: data.message,
            sender: 'CUSTOMER',
            sentiment: aiAnalysis.sentiment,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    // Auto-respond with AI if confidence is high
    if (!aiAnalysis.needsHumanEscalation && aiAnalysis.confidence > 0.7) {
      await prisma.message.create({
        data: {
          content: aiAnalysis.response,
          sender: 'AI',
          ticketId: ticket.id,
        },
      });
    } else {
      // Notify team members
      const agents = await prisma.workspaceMember.findMany({
        where: {
          workspaceId: workspace.id,
          role: { in: ['OWNER', 'ADMIN', 'AGENT'] },
        },
        include: { user: true },
      });

      for (const agent of agents) {
        await emailService.sendTicketNotification(
          agent.user.email,
          ticket.subject,
          ticket.customerName,
          ticket.id
        );
      }
    }

    return successResponse(c, { ticket, aiAnalysis }, 'Ticket created successfully', 201);
  }

  async list(c: Context) {
    const { workspaceId } = c.req.param();
    const user = c.get('user');
    const { status, priority, page = '1', limit = '20' } = c.req.query();

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = { workspaceId };

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ticket.count({ where }),
    ]);

    return successResponse(c, {
      tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  }

  async get(c: Context) {
    const { ticketId } = c.req.param();
    const workspace = c.get('workspace');

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        workspaceId: workspace.id,
      },
      include: {
        messages: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    if (!ticket) {
      throw new ApiError('Ticket not found', 404);
    }

    return successResponse(c, { ticket });
  }

  async addMessage(c: Context) {
    const { ticketId } = c.req.param();
    const user = c.get('user');
    const { content, isInternal } = c.get('validated');

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new ApiError('Ticket not found', 404);
    }

    const message = await prisma.message.create({
      data: {
        content,
        sender: 'AGENT',
        ticketId,
        userId: user.id,
        isInternal: isInternal || false,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Update ticket status if it was closed
    if (ticket.status === 'CLOSED') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return successResponse(c, { message }, 'Message added successfully', 201);
  }

  async update(c: Context) {
  const { ticketId } = c.req.param();
  const data = c.get('validated');
  const workspace = c.get("workspace");

  // Validate assigned agent
  if (data.assignedToId) {
    const member = await prisma.workspaceMember.findFirst({
      where: {
        userId: data.assignedToId,
        workspaceId: workspace.id,
      },
    });

    if (!member) {
      throw new ApiError("Assigned user is not a member of this workspace", 400);
    }
  }

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      ...data,
      resolvedAt: data.status === 'RESOLVED' ? new Date() : undefined,
    },
  });

  return successResponse(c, { ticket }, 'Ticket updated successfully');
}

}

export const ticketController = new TicketController();