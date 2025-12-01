import { Hono } from "hono";
import { analyticsController } from "@/controllers/analytics.controller";
import { authMiddleware } from "@/middlewares/auth";

const analyticsRoutes = new Hono();

analyticsRoutes.use("/*", authMiddleware);

analyticsRoutes.get("/:workspaceId/dashboard", (c) =>
  analyticsController.getDashboard(c)
);

analyticsRoutes.get("/:workspaceId/range", (c) =>
  analyticsController.getByDateRange(c)
);

analyticsRoutes.get("/:workspaceId/tickets", (c) =>
  analyticsController.getTicketStats(c)
);

analyticsRoutes.get("/:workspaceId/agents", (c) =>
  analyticsController.getAgentPerformance(c)
);

analyticsRoutes.post("/:workspaceId/record", (c) =>
  analyticsController.recordDailyMetrics(c)
);

export default analyticsRoutes;
