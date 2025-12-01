import { prisma } from "@/config/database";
import { ApiError } from "@/utils/response";
import type { Context } from "hono";
import type { Next } from "hono";
import type { Workspace } from "@prisma/client";

interface WorkspaceContext extends Context {
  set(key: "workspace", value: Workspace): void;
  get(key: "workspace"): Workspace;
}

export const loadWorkspace = async (
  c: WorkspaceContext,
  next: Next
): Promise<void> => {
  const { workspaceId } = c.req.param();

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) throw new ApiError("Workspace not found", 404);

  c.set("workspace", workspace);
  await next();
};
