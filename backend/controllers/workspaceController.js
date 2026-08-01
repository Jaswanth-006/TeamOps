import prisma from "../configs/prisma.js";

// Return every workspace the current user is a member of, with the full tree
// nested inside: members and their users, projects, each project's tasks with
// assignee and comments, and project members. One request hydrates the whole UI.
export const getUserWorkspaces = async (req, res) => {
  try {
    const { userId } = await req.auth();

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        owner: true,
        members: { include: { user: true } },
        projects: {
          include: {
            members: { include: { user: true } },
            tasks: {
              include: {
                assignee: true,
                comments: { include: { user: true } },
              },
            },
          },
        },
      },
    });

    res.json({ workspaces });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Add a user to a workspace with a role. Only an admin of the workspace may do
// this. Pattern: authenticate -> validate input -> authorize -> guard against
// duplicates -> act.
export const addMember = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { email, role, workspaceId, message } = req.body;

    if (!email || !workspaceId || !role) {
      return res
        .status(400)
        .json({ message: "email, workspaceId, and role are required" });
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // The caller must be an admin of this workspace.
    const isAdmin = workspace.members.some(
      (member) => member.userId === userId && member.role === "ADMIN"
    );
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "You do not have admin privileges" });
    }

    // Prevent duplicate membership.
    const alreadyMember = workspace.members.some(
      (member) => member.userId === user.id
    );
    if (alreadyMember) {
      return res.status(409).json({ message: "User is already a member" });
    }

    const member = await prisma.workspaceMember.create({
      data: { userId: user.id, workspaceId, role, message: message || "" },
    });

    res.status(201).json({ member, message: "Member added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
