import { format } from "date-fns";
import { allTasks } from "../utils/workspace";

// The most recently updated tasks across all projects.
const RecentActivity = ({ workspace }) => {
  const tasks = allTasks(workspace)
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6);

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-zinc-800">
      <h2 className="mb-4 text-sm font-semibold">Recent activity</h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-zinc-400">No tasks yet.</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="text-sm">
              <p className="truncate font-medium">{task.title}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {task.project.name} · {task.status} ·{" "}
                {format(new Date(task.updatedAt), "dd MMM")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentActivity;
