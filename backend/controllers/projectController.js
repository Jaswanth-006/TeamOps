import prisma from "../configs/prisma.js";
import { canManageProject } from "../utils/permissions.js";

// Create a project inside a workspace. Only a workspace admin may create one.
// The team lead arrives as an email and is resolved to a user id. Optional team
// members (also emails) are attached in a single batch insert.
export const createProject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const {
      workspaceId,
      description,
      name,
      status,
      start_date,
      end_date,
      team_members,
      team_lead,
      progress,
      priority,
    } = req.body;

    if (!name || !workspaceId || !team_lead) {
      return res
        .status(400)
        .json({ message: "name, workspaceId, and team_lead are required" });
    }

    // Load the workspace with its members to authorize the caller.
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const isAdmin = workspace.members.some(
      (member) => member.userId === userId && member.role === "ADMIN"
    );
    if (!isAdmin) {
      return res.status(403).json({
        message: "You don't have permission to create projects in this workspace",
      });
    }

    // Resolve the team lead (sent as an email) to a user id.
    const teamLead = await prisma.user.findUnique({
      where: { email: team_lead },
      select: { id: true },
    });
    if (!teamLead) {
      return res.status(404).json({ message: "Team lead not found" });
    }

    // Step 1: create the project.
    const project = await prisma.project.create({
      data: {
        workspaceId,
        name,
        description,
        status,
        priority,
        progress,
        team_lead: teamLead.id,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      },
    });

    // Step 2: attach any team members that belong to the workspace, in one batch.
    if (team_members?.length > 0) {
      const memberIds = workspace.members
        .filter((member) => team_members.includes(member.user.email))
        .map((member) => member.user.id);

      if (memberIds.length > 0) {
        await prisma.projectMember.createMany({
          data: memberIds.map((id) => ({ projectId: project.id, userId: id })),
        });
      }
    }

    // Step 3: return the project fully hydrated.
    const projectWithMembers = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        owner: true,
        members: { include: { user: true } },
        tasks: {
          include: { assignee: true, comments: { include: { user: true } } },
        },
      },
    });

    res
      .status(201)
      .json({ project: projectWithMembers, message: "Project created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Update a project. A workspace admin may update any project; otherwise the
// caller must be the project's own team lead (layered authorization).
export const updateProject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const {
      id,
      workspaceId,
      description,
      name,
      status,
      start_date,
      end_date,
      progress,
      priority,
    } = req.body;

    if (!id || !workspaceId) {
      return res
        .status(400)
        .json({ message: "id and workspaceId are required" });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const isAdmin = workspace.members.some(
      (member) => member.userId === userId && member.role === "ADMIN"
    );

    // Not an admin: fall back to allowing only the project's team lead.
    if (!isAdmin) {
      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (existing.team_lead !== userId) {
        return res.status(403).json({
          message: "You don't have permission to update this project",
        });
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        workspaceId,
        description,
        name,
        status,
        priority,
        progress,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      },
    });

    res.json({ project, message: "Project updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Add a member to a project. The project's team lead or the workspace admin
// (faculty) may do this. The project id comes from the URL path.
export const addMember = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { projectId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyMember = project.members.some(
      (member) => member.userId === user.id
    );
    if (alreadyMember) {
      return res.status(409).json({ message: "User is already a member" });
    }

    const member = await prisma.projectMember.create({
      data: { userId: user.id, projectId },
    });

    res.status(201).json({ member, message: "Member added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
