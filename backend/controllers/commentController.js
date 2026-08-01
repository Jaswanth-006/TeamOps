import prisma from "../configs/prisma.js";

// Add a comment to a task. The author must be a member of the task's project.
// Permission is derived through relations: task -> project -> members.
export const addComment = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { content, taskId } = req.body;

    if (!content || !taskId) {
      return res
        .status(400)
        .json({ message: "content and taskId are required" });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      include: { members: true },
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember =
      project.team_lead === userId ||
      project.members.some((member) => member.userId === userId);
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this project" });
    }

    const comment = await prisma.comment.create({
      data: { taskId, content, userId },
      include: { user: true },
    });

    res.status(201).json({ comment });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// List the comments on a task, oldest first, each with its author.
export const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    res.json({ comments });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
