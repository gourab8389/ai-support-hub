import { Context } from 'hono';
import { geminiService } from '@/services/gemini.service';
import { prisma } from '@/config/database';
import { successResponse } from '@/utils/response';

export class ChatController {
  async query(c: Context) {
    const workspace = c.get('workspace');
    const data = c.get('validated');

    const aiResponse = await geminiService.analyzeQuery(
      data.message,
      workspace.id,
      data.context
    );

    // If ticket ID provided, add message to existing ticket
    if (data.ticketId) {
      await prisma.message.create({
        data: {
          content: data.message,
          sender: 'CUSTOMER',
          ticketId: data.ticketId,
          sentiment: aiResponse.sentiment,
        },
      });

      if (!aiResponse.needsHumanEscalation) {
        await prisma.message.create({
          data: {
            content: aiResponse.response,
            sender: 'AI',
            ticketId: data.ticketId,
          },
        });
      }
    } else if (aiResponse.needsHumanEscalation) {
      // Create new ticket if escalation needed
      const ticket = await prisma.ticket.create({
        data: {
          subject: data.message.substring(0, 100),
          customerName: data.customerName || 'Anonymous',
          customerEmail: data.customerEmail || 'unknown@example.com',
          customerId: data.customerId,
          workspaceId: workspace.id,
          messages: {
            create: [
              {
                content: data.message,
                sender: 'CUSTOMER',
                sentiment: aiResponse.sentiment,
              },
            ],
          },
        },
      });

      return successResponse(c, {
        ...aiResponse,
        ticketId: ticket.id,
        escalated: true,
      });
    }

    return successResponse(c, aiResponse);
  }

  async searchKnowledge(c: Context) {
    const workspace = c.get('workspace');
    const { query, category, limit } = c.get('validated');

    const results = await geminiService.searchKnowledge(
      query,
      workspace.id,
      limit || 5
    );

    return successResponse(c, { results });
  }
}

export const chatController = new ChatController();