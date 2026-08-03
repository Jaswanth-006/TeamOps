import { allTasks } from "../utils/workspace";

const STATUSES = [
  { key: "TODO", label: "To Do", color: "bg-gray-400" },
  { key: "IN_PROGRESS", label: "In Progress", color: "bg-blue-500" },
  { key: "DONE", label: "Done", color: "bg-emerald-500" },
];

// Task counts by status for the current workspace.
const TasksSummary = ({ workspace }) => {
  const tasks = allTasks(workspace);

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-zinc-800">
      <h2 className="mb-4 text-sm font-semibold">Tasks by status</h2>
      <div className="space-y-3">
        {STATUSES.map(({ key, label, color }) => {
          const count = tasks.filter((t) => t.status === key).length;
          return (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${color}`} />
                {label}
              </span>
              <span className="font-medium">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TasksSummary;
