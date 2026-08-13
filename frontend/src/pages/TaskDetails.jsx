import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { CalendarIcon, PenIcon } from "lucide-react";

// Detail view for a single task, selected via projectId and taskId query params.
// Status controls, delete, and comments are added by later changes.
const TaskDetails = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const taskId = searchParams.get("taskId");
  const { currentWorkspace } = useSelector((state) => state.workspace);

  const project = currentWorkspace?.projects.find((p) => p.id === projectId);
  const task = project?.tasks.find((t) => t.id === taskId);

  if (!project || !task) {
    return <div className="text-red-500">Task not found.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-lg border border-gray-200 p-5 dark:border-zinc-800">
        <h1 className="text-lg font-semibold">{task.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
            {task.status}
          </span>
          <span className="rounded bg-blue-200 px-2 py-0.5 text-xs text-blue-900 dark:bg-blue-900 dark:text-blue-300">
            {task.type}
          </span>
          <span className="rounded bg-green-200 px-2 py-0.5 text-xs text-green-900 dark:bg-emerald-900 dark:text-emerald-300">
            {task.priority}
          </span>
        </div>

        {task.description && (
          <p className="mt-4 text-sm text-gray-600 dark:text-zinc-400">
            {task.description}
          </p>
        )}

        <hr className="my-4 border-gray-200 dark:border-zinc-700" />

        <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 dark:text-zinc-300 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            {task.assignee?.name || "Unassigned"}
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-4 text-gray-500" />
            Due: {format(new Date(task.due_date), "dd MMM yyyy")}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 dark:border-zinc-800">
        <p className="mb-2 flex items-center gap-2 font-medium">
          <PenIcon className="size-4" /> {project.name}
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-zinc-400">
          <span>Status: {project.status}</span>
          <span>Priority: {project.priority}</span>
          <span>Progress: {project.progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
