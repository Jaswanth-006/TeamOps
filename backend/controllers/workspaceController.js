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
