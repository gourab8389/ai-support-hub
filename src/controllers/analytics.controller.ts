import { Context } from "hono";
import { prisma } from "@/config/database";
import { successResponse, ApiError } from "@/utils/response";

export class AnalyticsController {
  async getDashboard(c: Context) {
    const { workspaceId } = c.req.param();
    const user = c.get("user");

    // Check permission
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!member) {
      throw new ApiError("Insufficient permissions", 403);
    }

    // Get date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Get analytics data
    const analytics = await prisma.analytics.findMany({
      where: {
        workspaceId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // Get current stats
    const [
      totalTickets,
      openTickets,
      resolvedTickets,
      totalAgents,
      totalKnowledge,
    ] = await Promise.all([
      prisma.ticket.count({ where: { workspaceId } }),
      prisma.ticket.count({ where: { workspaceId, status: "OPEN" } }),
      prisma.ticket.count({ where: { workspaceId, status: "RESOLVED" } }),
      prisma.workspaceMember.count({
        where: { workspaceId, role: { in: ["AGENT", "ADMIN", "OWNER"] } },
      }),
      prisma.knowledgeBase.count({ where: { workspaceId } }),
    ]);

    // Calculate averages from analytics
    const avgResponseTime =
      analytics.length > 0
        ? Math.round(
            analytics.reduce((sum, a) => sum + a.avgResponseTime, 0) /
              analytics.length
          )
        : 0;

    const avgAIResolution =
      analytics.length > 0
        ? parseFloat(
            (
              analytics.reduce((sum, a) => sum + a.aiResolutionRate, 0) /
              analytics.length
            ).toFixed(2)
          )
        : 0;

    const avgSatisfaction =
      analytics.length > 0
        ? parseFloat(
            (
              analytics.reduce((sum, a) => sum + a.customerSatisfaction, 0) /
              analytics.length
            ).toFixed(2)
          )
        : 0;

    return successResponse(c, {
      overview: {
        totalTickets,
        openTickets,
        resolvedTickets,
        totalAgents,
        totalKnowledge,
        avgResponseTime,
        aiResolutionRate: avgAIResolution,
        customerSatisfaction: avgSatisfaction,
      },
      timeline: analytics,
    });
  }

  async getByDateRange(c: Context) {
    const { workspaceId } = c.req.param();
    const user = c.get("user");
    const { startDate, endDate } = c.req.query();

    // Check permission
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!member) {
      throw new ApiError("Insufficient permissions", 403);
    }

    const analytics = await prisma.analytics.findMany({
      where: {
        workspaceId,
        date: {
          gte: new Date(
            startDate || new Date().setDate(new Date().getDate() - 30)
          ),
          lte: new Date(endDate || new Date()),
        },
      },
      orderBy: { date: "asc" },
    });

    return successResponse(c, { analytics });
  }

  async getTicketStats(c: Context) {
    const { workspaceId } = c.req.param();
    const user = c.get("user");

    // Check permission
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
        role: { in: ["OWNER", "ADMIN", "AGENT"] },
      },
    });

    if (!member) {
      throw new ApiError("Insufficient permissions", 403);
    }

    // Get ticket stats by status
    const [open, inProgress, resolved, closed] = await Promise.all([
      prisma.ticket.count({ where: { workspaceId, status: "OPEN" } }),
      prisma.ticket.count({ where: { workspaceId, status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { workspaceId, status: "RESOLVED" } }),
      prisma.ticket.count({ where: { workspaceId, status: "CLOSED" } }),
    ]);

    // Get ticket stats by priority
    const [low, medium, high, urgent] = await Promise.all([
      prisma.ticket.count({ where: { workspaceId, priority: "LOW" } }),
      prisma.ticket.count({ where: { workspaceId, priority: "MEDIUM" } }),
      prisma.ticket.count({ where: { workspaceId, priority: "HIGH" } }),
      prisma.ticket.count({ where: { workspaceId, priority: "URGENT" } }),
    ]);

    return successResponse(c, {
      byStatus: {
        open,
        inProgress,
        resolved,
        closed,
        total: open + inProgress + resolved + closed,
      },
      byPriority: {
        low,
        medium,
        high,
        urgent,
      },
    });
  }

  async getAgentPerformance(c: Context) {
    const { workspaceId } = c.req.param();
    const user = c.get("user");

    // Check permission
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!member) {
      throw new ApiError("Insufficient permissions", 403);
    }

    // Get all agents
    const agents = await prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        role: { in: ["AGENT", "ADMIN", "OWNER"] },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Get performance for each agent
    const performance = await Promise.all(
      agents.map(async (agent) => {
        const [assignedTickets, resolvedTickets, messages] = await Promise.all([
          prisma.ticket.count({
            where: { workspaceId, assignedToId: agent.userId },
          }),
          prisma.ticket.count({
            where: {
              workspaceId,
              assignedToId: agent.userId,
              status: "RESOLVED",
            },
          }),
          prisma.message.count({
            where: {
              userId: agent.userId,
              sender: "AGENT",
            },
          }),
        ]);

        return {
          agent: agent.user,
          role: agent.role,
          assignedTickets,
          resolvedTickets,
          resolutionRate:
            assignedTickets > 0
              ? ((resolvedTickets / assignedTickets) * 100).toFixed(2)
              : 0,
          totalMessages: messages,
        };
      })
    );

    return successResponse(c, { performance });
  }

  async recordDailyMetrics(c: Context) {
    const { workspaceId } = c.req.param();
    const user = c.get("user");

    // Check permission (OWNER only)
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
        role: "OWNER",
      },
    });

    if (!member) {
      throw new ApiError("Only owners can record metrics", 403);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate metrics for today
    const [totalTickets, resolvedTickets, messages] = await Promise.all([
      prisma.ticket.count({
        where: {
          workspaceId,
          createdAt: { gte: today },
        },
      }),
      prisma.ticket.count({
        where: {
          workspaceId,
          status: "RESOLVED",
          resolvedAt: { gte: today },
        },
      }),
      prisma.message.findMany({
        where: {
          createdAt: { gte: today },
          ticket: { workspaceId },
        },
        select: {
          createdAt: true,
          sender: true,
          ticketId: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Calculate AI resolution rate
    const aiMessages = messages.filter((m) => m.sender === "AI").length;
    const aiResolutionRate =
      totalTickets > 0 ? (aiMessages / totalTickets) * 100 : 0;

    // Calculate average response time
    const ticketResponseTimes: number[] = [];
    const ticketMessages = messages.reduce((acc, msg) => {
      if (!acc[msg.ticketId]) acc[msg.ticketId] = [];
      acc[msg.ticketId].push(msg);
      return acc;
    }, {} as Record<string, typeof messages>);

    Object.values(ticketMessages).forEach((msgs) => {
      if (msgs.length >= 2) {
        const firstCustomer = msgs.find((m) => m.sender === "CUSTOMER");
        const firstResponse = msgs.find(
          (m) => m.sender === "AI" || m.sender === "AGENT"
        );
        if (firstCustomer && firstResponse) {
          const diff =
            (firstResponse.createdAt.getTime() -
              firstCustomer.createdAt.getTime()) /
            1000;
          ticketResponseTimes.push(diff);
        }
      }
    });

    const avgResponseTime =
      ticketResponseTimes.length > 0
        ? Math.round(
            ticketResponseTimes.reduce((a, b) => a + b, 0) /
              ticketResponseTimes.length
          )
        : 0;

    // Upsert analytics
    const analytics = await prisma.analytics.upsert({
      where: {
        workspaceId_date: {
          workspaceId,
          date: today,
        },
      },
      update: {
        totalTickets,
        resolvedTickets,
        avgResponseTime,
        aiResolutionRate,
      },
      create: {
        workspaceId,
        date: today,
        totalTickets,
        resolvedTickets,
        avgResponseTime,
        aiResolutionRate,
        customerSatisfaction: 0,
      },
    });

    return successResponse(c, { analytics }, "Metrics recorded successfully");
  }
}

export const analyticsController = new AnalyticsController();
