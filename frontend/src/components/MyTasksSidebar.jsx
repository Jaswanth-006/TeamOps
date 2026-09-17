import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { CheckSquare, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const statusDot = (s) =>
  s === "DONE"
    ? "bg-green-500"
    : s === "IN_PROGRESS"
      ? "bg-yellow-500"
      : "bg-gray-400 dark:bg-zinc-500";

// Sidebar panel of every task assigned to the current user, across their teams.
const MyTasksSidebar = ({ onNavigate }) => {
  const { user } = useAuth();
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const [open, setOpen] = useState(true);

  const myTasks = (currentWorkspace?.projects || []).flatMap((p) =>
    (p.tasks || [])
      .filter((t) => t.assigneeId === user?.id)
      .map((t) => ({ ...t, projectId: p.id }))
  );

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800"
      >
        <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-zinc-300">
          <CheckSquare className="size-4" /> My Tasks
          <span className="rounded bg-gray-200 px-1.5 text-xs dark:bg-zinc-700">
            {myTasks.length}
          </span>
        </span>
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
      </button>

      {open && (
        <div className="mt-1 space-y-1 pl-2">
          {myTasks.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-500 dark:text-zinc-500">
              No tasks assigned to you.
            </p>
          ) : (
            myTasks.map((t) => (
              <Link
                key={t.id}
                to={`/taskDetails?projectId=${t.projectId}&taskId=${t.id}`}
                onClick={onNavigate}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <span className={`size-2 shrink-0 rounded-full ${statusDot(t.status)}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{t.title}</span>
                  <span className="block text-gray-500 dark:text-zinc-500">
                    {t.status.replace("_", " ").toLowerCase()}
                  </span>
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MyTasksSidebar;
