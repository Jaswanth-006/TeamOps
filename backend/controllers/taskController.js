import prisma from "../configs/prisma.js";
import { sendMail } from "../configs/mailer.js";

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

    // Notify the assignee. Best-effort and after the response, so a mail issue
    // never affects task creation.
    if (taskWithAssignee.assignee?.email) {
      sendMail({
        to: taskWithAssignee.assignee.email,
        subject: `New task assigned: ${taskWithAssignee.title}`,
        text: `You have been assigned the task "${taskWithAssignee.title}".`,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Update a task. Only the project's team lead may update it. Powers the
// TODO -> IN_PROGRESS -> DONE status flow.
export const updateTask = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { userId } = await req.auth();

    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (project.team_lead !== userId) {
      return res
        .status(403)
        .json({ message: "You don't have admin privileges for this project" });
    }

    // Only allow known fields to be updated, and coerce the date if present.
    const { title, description, status, type, priority, assigneeId, due_date } =
      req.body;
    const data = { title, description, status, type, priority, assigneeId };
    if (due_date !== undefined) {
      data.due_date = new Date(due_date);
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ task: updatedTask, message: "Task updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Delete one or more tasks in a single operation. Only the team lead of the
// tasks' project may delete them.
export const deleteTask = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { tasksIds } = req.body;

    if (!Array.isArray(tasksIds) || tasksIds.length === 0) {
      return res
        .status(400)
        .json({ message: "tasksIds must be a non-empty array" });
    }

    const tasks = await prisma.task.findMany({
      where: { id: { in: tasksIds } },
    });
    if (tasks.length === 0) {
      return res.status(404).json({ message: "Tasks not found" });
    }

    const project = await prisma.project.findUnique({
      where: { id: tasks[0].projectId },
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (project.team_lead !== userId) {
      return res
        .status(403)
        .json({ message: "You don't have admin privileges for this project" });
    }

    await prisma.task.deleteMany({ where: { id: { in: tasksIds } } });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
