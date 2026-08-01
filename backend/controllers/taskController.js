import prisma from "../configs/prisma.js";

// Create a task in a project. Only the project's team lead may create tasks, and
// the assignee must be a member of the project.
export const createTask = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const {
      projectId,
      title,
      description,
      type,
      status,
      priority,
      assigneeId,
      due_date,
    } = req.body;

    if (!projectId || !title || !assigneeId || !due_date) {
      return res.status(400).json({
        message: "projectId, title, assigneeId, and due_date are required",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (project.team_lead !== userId) {
      return res
        .status(403)
        .json({ message: "You don't have admin privileges for this project" });
    }
    if (!project.members.some((member) => member.userId === assigneeId)) {
      return res
        .status(403)
        .json({ message: "Assignee is not a member of the project" });
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        priority,
        assigneeId,
        status,
        type,
        due_date: new Date(due_date),
      },
    });

    const taskWithAssignee = await prisma.task.findUnique({
      where: { id: task.id },
      include: { assignee: true },
    });

    res
      .status(201)
      .json({ task: taskWithAssignee, message: "Task created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
