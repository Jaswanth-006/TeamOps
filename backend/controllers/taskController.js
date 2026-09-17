import prisma from "../configs/prisma.js";
import { sendMail } from "../configs/mailer.js";
import { canManageProject } from "../utils/permissions.js";

// Create a task in a project. The project's team lead or the workspace admin
// (faculty) may create tasks; the assignee must be a member of the project or
// its team lead.
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
    if (!(await canManageProject(project, userId))) {
      return res
        .status(403)
        .json({ message: "You don't have permission to manage this team" });
    }
    const assigneeIsOnTeam =
      assigneeId === project.team_lead ||
      project.members.some((member) => member.userId === assigneeId);
    if (!assigneeIsOnTeam) {
      return res
        .status(403)
        .json({ message: "Assignee is not a member of the team" });
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

// Update a task. Faculty and the team lead may edit any field; the person the
// task is assigned to may update only its status (to move their own work along).
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

    const isManager = await canManageProject(project, userId);
    const isAssignee = task.assigneeId === userId;
    if (!isManager && !isAssignee) {
      return res
        .status(403)
        .json({ message: "You don't have permission to update this task" });
    }

    let data;
    if (isManager) {
      // Managers may edit all known fields; coerce the date if present.
      const { title, description, status, type, priority, assigneeId, due_date } =
        req.body;
      data = { title, description, status, type, priority, assigneeId };
      if (due_date !== undefined) {
        data.due_date = new Date(due_date);
      }
    } else {
      // A plain assignee may change only the status of their own task.
      data = { status: req.body.status };
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

// Delete one or more tasks in a single operation. The team lead of the tasks'
// project or the workspace admin (faculty) may delete them.
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
    if (!(await canManageProject(project, userId))) {
      return res
        .status(403)
        .json({ message: "You don't have permission to manage this team" });
    }

    await prisma.task.deleteMany({ where: { id: { in: tasksIds } } });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
