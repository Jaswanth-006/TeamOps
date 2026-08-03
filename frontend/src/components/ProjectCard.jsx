import { useNavigate } from "react-router-dom";

const PRIORITY_STYLES = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

// A single project summary; navigates to the project detail view.
const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const taskCount = project.tasks?.length || 0;
  const done = (project.tasks || []).filter((t) => t.status === "DONE").length;

  return (
    <button
      onClick={() => navigate(`/projectsDetail?projectId=${project.id}`)}
      className="rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-blue-400 dark:border-zinc-800"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-medium">{project.name}</h3>
        <span
          className={`rounded px-2 py-0.5 text-xs ${PRIORITY_STYLES[project.priority] || ""}`}
        >
          {project.priority}
        </span>
      </div>
      {project.description && (
        <p className="mb-3 line-clamp-2 text-sm text-gray-500 dark:text-zinc-400">
          {project.description}
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
        <span>{project.status}</span>
        <span>
          {done}/{taskCount} tasks
        </span>
      </div>
    </button>
  );
};

export default ProjectCard;
