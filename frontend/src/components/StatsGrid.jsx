import { FolderKanban, ListTodo, CheckCircle2, Users } from "lucide-react";
import { allTasks } from "../utils/workspace";

// Summary tiles derived from the current workspace.
const StatsGrid = ({ workspace }) => {
  const tasks = allTasks(workspace);
  const done = tasks.filter((t) => t.status === "DONE").length;

  const stats = [
    { label: "Projects", value: workspace.projects.length, icon: FolderKanban },
    { label: "Tasks", value: tasks.length, icon: ListTodo },
    { label: "Completed", value: done, icon: CheckCircle2 },
    { label: "Members", value: workspace.members.length, icon: Users },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
  );
};

export default StatsGrid;
