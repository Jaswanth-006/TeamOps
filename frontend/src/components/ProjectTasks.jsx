import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import CreateTaskDialog from "./CreateTaskDialog";
import { useCanManageProject } from "../hooks/useRole";

const COLUMNS = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "DONE", label: "Done" },
];

// Kanban-style board grouping a team's tasks by status. Only faculty or the team
// lead can add tasks.
const ProjectTasks = ({ project }) => {
  const navigate = useNavigate();
  const tasks = project.tasks || [];
  const [showCreate, setShowCreate] = useState(false);
  const canManage = useCanManageProject(project);

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="size-4" /> New task
          </button>
        </div>
      )}

      {showCreate && (
        <CreateTaskDialog project={project} onClose={() => setShowCreate(false)} />
      )}

      <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map(({ key, label }) => {
        const columnTasks = tasks.filter((t) => t.status === key);
        return (
          <div
            key={key}
            className="rounded-lg border border-gray-200 p-3 dark:border-zinc-800"
          >
            <h3 className="mb-3 flex items-center justify-between text-sm font-semibold">
              {label}
              <span className="text-gray-400">{columnTasks.length}</span>
            </h3>
            <div className="space-y-2">
              {columnTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() =>
                    navigate(`/taskDetails?projectId=${project.id}&taskId=${task.id}`)
                  }
                  className="w-full rounded border border-gray-200 p-3 text-left text-sm hover:border-blue-400 dark:border-zinc-700"
                >
                  <p className="font-medium">{task.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                    <span>{task.priority}</span>
                    {task.assignee && <span>· {task.assignee.name}</span>}
                  </div>
                </button>
              ))}
              {columnTasks.length === 0 && (
                <p className="text-xs text-gray-400">No tasks</p>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default ProjectTasks;
