import { prisma } from "@/config/database";
import { ApiError } from "@/utils/response";
import type { Context, Next } from "hono";
import type { UserRole } from "@prisma/client";

export const loadWorkspace = async (c: Context, next: Next): Promise<void> => {
  const { workspaceId } = c.req.param();

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new ApiError("Workspace not found", 404);
  }

  c.set("workspace", workspace);
  await next();
};

export const requireWorkspaceMember = (roles?: UserRole[]) => {
  return async (c: Context, next: Next): Promise<void> => {
    const user = c.get("user");
    const workspace = c.get("workspace");

    if (!user) {
      throw new ApiError("Authentication required", 401);
    }

    if (!workspace) {
      throw new ApiError("Workspace context missing", 500);
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspace.id,
        },
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!member) {
      throw new ApiError("You do not have access to this workspace", 403);
    }

    if (roles && !roles.includes(member.role)) {
      throw new ApiError("Insufficient permissions", 403);
    }

    c.set("workspaceMember", member);
    await next();
  };
};
