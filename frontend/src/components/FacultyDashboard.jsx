import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  FolderKanban,
  Users,
  ListTodo,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import ProjectAnalytics from "./ProjectAnalytics";
import { setCurrentWorkspace } from "../features/workspaceSlice";

const projectsOf = (ws) => ws.projects || [];
const tasksOf = (ws) => projectsOf(ws).flatMap((p) => p.tasks || []);
const studentsOf = (ws) =>
  (ws.members || []).filter((m) => m.role === "MEMBER").length;

// Faculty landing view: analytics rolled up across every class the faculty runs,
// plus a card per class to drill into.
const FacultyDashboard = ({ workspaces }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const allProjects = workspaces.flatMap(projectsOf);
  const allTasks = workspaces.flatMap(tasksOf);
  const doneTasks = allTasks.filter((t) => t.status === "DONE").length;
  // Count each student once even if they appear in more than one class.
  const studentIds = new Set(
    workspaces.flatMap((ws) =>
      (ws.members || []).filter((m) => m.role === "MEMBER").map((m) => m.userId)
    )
  );

  const stats = [
    { label: "Classes", value: workspaces.length, icon: LayoutGrid },
    { label: "Teams", value: allProjects.length, icon: FolderKanban },
    { label: "Students", value: studentIds.size, icon: Users },
    { label: "Tasks", value: allTasks.length, icon: ListTodo },
    { label: "Completed", value: doneTasks, icon: CheckCircle2 },
  ];

  const openClass = (id) => {
    dispatch(setCurrentWorkspace(id));
    navigate("/class");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Faculty dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Across {workspaces.length} {workspaces.length === 1 ? "class" : "classes"} you run.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-lg border border-gray-200 p-4 dark:border-zinc-800"
          >
            <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400">
              <Icon className="size-4" />
              <span className="text-sm">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Your classes</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => {
            const teams = projectsOf(ws);
            const wsTasks = tasksOf(ws);
            const wsDone = wsTasks.filter((t) => t.status === "DONE").length;
            const progress = wsTasks.length
              ? Math.round((wsDone / wsTasks.length) * 100)
              : 0;
            return (
              <button
                key={ws.id}
                onClick={() => openClass(ws.id)}
                className="group flex flex-col rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-blue-400 dark:border-zinc-800 dark:hover:border-blue-500"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{ws.name}</h3>
                  <ArrowRight className="size-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-zinc-400">
                  <span>{teams.length} teams</span>
                  <span>{studentsOf(ws)} students</span>
                  <span>{wsTasks.length} tasks</span>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-gray-500 dark:text-zinc-400">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-zinc-800">
                    <div
                      className="h-1.5 rounded-full bg-blue-600"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">All classes — task analytics</h2>
        <ProjectAnalytics workspace={{ projects: allProjects }} />
      </div>
    </div>
  );
};

export default FacultyDashboard;
