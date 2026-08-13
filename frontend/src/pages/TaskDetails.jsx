import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import { CalendarIcon, PenIcon } from "lucide-react";
import toast from "react-hot-toast";
import api from "../configs/api";
import { updateTask } from "../features/workspaceSlice";

const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];

// Detail view for a single task, selected via projectId and taskId query params.
const TaskDetails = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const taskId = searchParams.get("taskId");
  const dispatch = useDispatch();
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const [updating, setUpdating] = useState(false);

  const project = currentWorkspace?.projects.find((p) => p.id === projectId);
  const task = project?.tasks.find((t) => t.id === taskId);

  if (!project || !task) {
    return <div className="text-red-500">Task not found.</div>;
  }

  const changeStatus = async (status) => {
    if (status === task.status) return;
    setUpdating(true);
    try {
      const { data } = await api.put(`/tasks/${task.id}`, { status });
      dispatch(updateTask({ ...data.task, projectId: project.id }));
      toast.success(`Moved to ${status}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update task");
    } finally {
      setUpdating(false);
    }
  };

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

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-zinc-400">Status:</span>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              disabled={updating}
              className={`rounded px-2 py-1 text-xs ${
                s === task.status
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

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
