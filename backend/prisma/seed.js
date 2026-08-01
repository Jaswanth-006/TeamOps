import prisma from "../configs/prisma.js";
import { hashPassword } from "../configs/password.js";

// Populate the database with a small, predictable dataset for local development:
// three users, one workspace, and their memberships. Passwords are hashed so the
// login flow can verify them the same way it will for real accounts.

const PASSWORD = "password123";

async function main() {
  // Start from a clean slate so the seed is repeatable. Delete in dependency
  // order (children before parents).
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword(PASSWORD);

  const [alex, john, oliver] = await Promise.all([
    prisma.user.create({
      data: { id: "user_1", name: "Alex Smith", email: "alex@example.com", password: passwordHash },
    }),
    prisma.user.create({
      data: { id: "user_2", name: "John Warrel", email: "john@example.com", password: passwordHash },
    }),
    prisma.user.create({
      data: { id: "user_3", name: "Oliver Watts", email: "oliver@example.com", password: passwordHash },
    }),
  ]);

  const workspace = await prisma.workspace.create({
    data: {
      id: "org_1",
      name: "Corp Workspace",
      slug: "corp-workspace",
      ownerId: oliver.id,
    },
  });

  await prisma.workspaceMember.createMany({
    data: [
      { userId: alex.id, workspaceId: workspace.id, role: "ADMIN" },
      { userId: john.id, workspaceId: workspace.id, role: "MEMBER" },
      { userId: oliver.id, workspaceId: workspace.id, role: "ADMIN" },
    ],
  });

  console.log("Seed complete:");
  console.log(`  users:      ${alex.email}, ${john.email}, ${oliver.email}`);
  console.log(`  password:   ${PASSWORD} (for all seeded users)`);
  console.log(`  workspace:  ${workspace.name} (${workspace.slug})`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
