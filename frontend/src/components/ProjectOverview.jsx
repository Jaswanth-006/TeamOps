import { format } from "date-fns";

// Read-only summary of a project.
const ProjectOverview = ({ project }) => {
  const fmt = (d) => (d ? format(new Date(d), "dd MMM yyyy") : "—");

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-zinc-800">
      {project.description && (
        <p className="text-sm text-gray-700 dark:text-zinc-300">{project.description}</p>
      )}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500 dark:text-zinc-400">Start date</p>
          <p>{fmt(project.start_date)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-zinc-400">End date</p>
          <p>{fmt(project.end_date)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-zinc-400">Progress</p>
          <p>{project.progress}%</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-zinc-400">Members</p>
          <p>{project.members?.length || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;
