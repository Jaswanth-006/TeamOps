import { useNavigate } from "react-router-dom";

const COLUMNS = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "DONE", label: "Done" },
];

// Kanban-style board grouping a project's tasks by status. Task creation and
// status changes are added later; this renders the board.
const ProjectTasks = ({ project }) => {
  const navigate = useNavigate();
  const tasks = project.tasks || [];

  return (
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
  );
};

export default ProjectTasks;
