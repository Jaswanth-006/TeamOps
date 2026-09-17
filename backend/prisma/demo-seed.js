import prisma from "../configs/prisma.js";
import { hashPassword } from "../configs/password.js";

// Rich demo dataset for a live faculty walkthrough: one class, six student teams,
// realistic tasks across TODO / IN_PROGRESS / DONE, and discussion comments.

const FACULTY = {
  name: "Jaswanth Saravanan",
  email: "jaswanth.s006@gmail.com",
  password: "Jaswanth@123",
};
const STUDENT_PASSWORD = "student123";

const studentNames = [
  "Aarav Sharma", "Diya Patel", "Ishaan Reddy",
  "Ananya Nair", "Vihaan Gupta", "Aisha Khan",
  "Arjun Mehta", "Saanvi Iyer", "Reyansh Rao",
  "Myra Singh", "Kabir Joshi", "Anika Desai",
  "Vivaan Kumar", "Kiara Menon", "Aditya Verma",
  "Riya Kapoor", "Rohan Das", "Neha Pillai",
];

const teams = [
  { name: "Serverless Image Pipeline", description: "An event-driven image processing service using Lambda and S3.", priority: "HIGH", status: "ACTIVE" },
  { name: "Real-Time Chat Platform", description: "A WebSocket chat application with presence and history.", priority: "MEDIUM", status: "ACTIVE" },
  { name: "E-Commerce Microservices", description: "A microservices storefront with a cart and orders.", priority: "HIGH", status: "ACTIVE" },
  { name: "IoT Telemetry Dashboard", description: "Ingesting sensor data and visualising it live.", priority: "MEDIUM", status: "PLANNING" },
  { name: "Video Streaming CDN", description: "Adaptive video delivery over a content network.", priority: "LOW", status: "ACTIVE" },
  { name: "ML Model Serving API", description: "Serving a trained model behind an autoscaling API.", priority: "HIGH", status: "ACTIVE" },
];

const taskTitles = [
  "Design the VPC and subnets", "Set up the CI/CD pipeline", "Implement user authentication",
  "Write the REST API endpoints", "Design the database schema", "Containerize the services",
  "Deploy to AWS", "Add monitoring and alerts", "Write integration tests",
  "Load-test the API", "Configure the load balancer", "Set up auto-scaling",
  "Wire up the frontend", "Add role-based access control", "Document the architecture",
  "Optimise the database queries", "Set up secrets management", "Add a caching layer",
];
const taskDescriptions = [
  "Break the work down and confirm the approach with the team.",
  "Follow the reference architecture and note any deviations.",
  "Keep it small and reviewable; open a PR when ready.",
  "Coordinate with the frontend owner before merging.",
  "Add tests and update the docs alongside the change.",
];
const facultyComments = [
  "Good progress — please add error handling before the review.",
  "Can you have this ready for Friday's checkpoint?",
  "Nicely done. Approved.",
  "Remember to document the endpoints for the other teams.",
  "Let's discuss the trade-offs in the next session.",
];
const studentComments = [
  "On it — should be done by tomorrow.",
  "Blocked on the AWS credentials, resolving today.",
  "Pushed the changes, ready for review.",
  "Added tests and updated the README.",
  "Thanks, will refactor as suggested.",
];

const statuses = ["TODO", "IN_PROGRESS", "DONE"];
const types = ["TASK", "FEATURE", "BUG", "IMPROVEMENT"];
const priorities = ["LOW", "MEDIUM", "HIGH"];

const daysFromNow = (d) => { const x = new Date(); x.setDate(x.getDate() + d); return x; };
const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];

async function main() {
  // Clean slate (children before parents).
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const facultyPass = await hashPassword(FACULTY.password);
  const studentPass = await hashPassword(STUDENT_PASSWORD);

  const faculty = await prisma.user.create({
    data: { name: FACULTY.name, email: FACULTY.email, password: facultyPass },
  });

  const students = [];
  for (const name of studentNames) {
    const email = name.toLowerCase().replace(/[^a-z]+/g, ".") + "@student.edu";
    students.push(
      await prisma.user.create({ data: { name, email, password: studentPass } })
    );
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: "Introduction to Cloud Computing — Sem 5",
      slug: "cloud-computing-sem5",
      description: "Class workspace for the Introduction to Cloud Computing course.",
      ownerId: faculty.id,
    },
  });

  await prisma.workspaceMember.create({
    data: { userId: faculty.id, workspaceId: workspace.id, role: "ADMIN" },
  });
  for (const s of students) {
    await prisma.workspaceMember.create({
      data: { userId: s.id, workspaceId: workspace.id, role: "MEMBER" },
    });
  }

  let titleIdx = 0;
  let commentIdx = 0;

  for (let t = 0; t < teams.length; t++) {
    const teamMembers = [students[t * 3], students[t * 3 + 1], students[t * 3 + 2]];
    const lead = teamMembers[0];

    const project = await prisma.project.create({
      data: {
        name: teams[t].name,
        description: teams[t].description,
        priority: teams[t].priority,
        status: teams[t].status,
        progress: 0,
        team_lead: lead.id,
        workspaceId: workspace.id,
        start_date: daysFromNow(-14),
        end_date: daysFromNow(30),
      },
    });

    await prisma.projectMember.createMany({
      data: teamMembers.map((u) => ({ userId: u.id, projectId: project.id })),
    });

    const nTasks = 4;
    let done = 0;
    for (let k = 0; k < nTasks; k++) {
      const status = pick(statuses, t + k);
      if (status === "DONE") done++;
      const assignee = teamMembers[k % teamMembers.length];

      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          title: pick(taskTitles, titleIdx++),
          description: pick(taskDescriptions, k),
          status,
          type: pick(types, k),
          priority: pick(priorities, t + k),
          assigneeId: assignee.id,
          due_date: daysFromNow(3 + k * 5),
        },
      });

      if (k % 2 === 0) {
        await prisma.comment.create({
          data: { taskId: task.id, userId: faculty.id, content: pick(facultyComments, commentIdx++) },
        });
        await prisma.comment.create({
          data: { taskId: task.id, userId: assignee.id, content: pick(studentComments, commentIdx++) },
        });
      }
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { progress: Math.round((done / nTasks) * 100) },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    teams: await prisma.project.count(),
    tasks: await prisma.task.count(),
    comments: await prisma.comment.count(),
  };

  console.log("Demo data created.");
  console.log(counts);
  console.log("");
  console.log("FACULTY LOGIN:", FACULTY.email, "/", FACULTY.password);
  console.log("STUDENT LOGIN:", students[0].email, "/", STUDENT_PASSWORD, "(all students use this password)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
