import prisma from "../configs/prisma.js";

// A user may manage a project — its tasks, members, and discussion — if they are
// the project's team lead, OR an ADMIN of the project's workspace.
//
// In classroom terms: the team leader manages their own team, and the faculty
// (workspace admin / class head) manages every team in the class.
//
// The `project` passed in must include its `team_lead` and `workspaceId` fields
// (both are scalar fields returned by a normal project lookup).
export async function canManageProject(project, userId) {
  if (project.team_lead === userId) return true;

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId: project.workspaceId },
    },
  });

  return membership?.role === "ADMIN";
}
