import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import ProjectTasks from "../components/ProjectTasks";
import ProjectOverview from "../components/ProjectOverview";
import ProjectSettings from "../components/ProjectSettings";
import ProjectCalendar from "../components/ProjectCalendar";

const TABS = ["Tasks", "Overview", "Calendar"];

// Detail view for a single project, selected via the projectId query param.
// The tab panels are filled in by later changes.
const ProjectDetails = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const [tab, setTab] = useState("Tasks");

  const project = currentWorkspace?.projects.find((p) => p.id === projectId);

  if (!project) {
    return <div className="text-gray-500 dark:text-zinc-400">Project not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-zinc-400">
          <span>Status: {project.status}</span>
          <span>Priority: {project.priority}</span>
          <span>Progress: {project.progress}%</span>
          <span>{project.tasks?.length || 0} tasks</span>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm ${
              tab === t
                ? "border-b-2 border-blue-600 font-medium text-blue-600"
                : "text-gray-500 dark:text-zinc-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        {tab === "Tasks" && <ProjectTasks project={project} />}
        {tab === "Overview" && (
          <div className="space-y-6">
            <ProjectOverview project={project} />
            <ProjectSettings project={project} />
          </div>
        )}
        {tab === "Calendar" && <ProjectCalendar project={project} />}
      </div>
    </div>
  );
};

export default ProjectDetails;
