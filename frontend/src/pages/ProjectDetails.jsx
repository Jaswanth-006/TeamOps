import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { UserPlus } from "lucide-react";
import ProjectTasks from "../components/ProjectTasks";
import ProjectAnalytics from "../components/ProjectAnalytics";
import ProjectOverview from "../components/ProjectOverview";
import ProjectSettings from "../components/ProjectSettings";
import ProjectCalendar from "../components/ProjectCalendar";
import AddTeamMemberDialog from "../components/AddTeamMemberDialog";
import { useCanManageProject } from "../hooks/useRole";

// Map the sidebar's ?tab= values to tab labels.
const TAB_FROM_PARAM = {
  tasks: "Tasks",
  analytics: "Analytics",
  calendar: "Calendar",
  overview: "Overview",
  settings: "Settings",
};

// Detail view for a single team, selected via the projectId query param.
const ProjectDetails = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const [showAddMember, setShowAddMember] = useState(false);

  const project = currentWorkspace?.projects.find((p) => p.id === projectId);
  const canManage = useCanManageProject(project);

  const tabs = ["Tasks", "Analytics", "Calendar", "Overview", ...(canManage ? ["Settings"] : [])];
  const [tab, setTab] = useState(TAB_FROM_PARAM[searchParams.get("tab")] || "Tasks");

  if (!project) {
    return <div className="text-gray-500 dark:text-zinc-400">Team not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-zinc-400">
            <span>Leader: {project.owner?.name || "—"}</span>
            <span>Status: {project.status}</span>
            <span>Priority: {project.priority}</span>
            <span>Progress: {project.progress}%</span>
            <span>{project.members?.length || 0} members</span>
            <span>{project.tasks?.length || 0} tasks</span>
          </div>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAddMember(true)}
            className="flex shrink-0 items-center gap-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <UserPlus className="size-4" /> Add member
          </button>
        )}
      </div>

      {showAddMember && (
        <AddTeamMemberDialog
          projectId={project.id}
          onClose={() => setShowAddMember(false)}
        />
      )}

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {tabs.map((t) => (
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
        {tab === "Analytics" && <ProjectAnalytics workspace={{ projects: [project] }} />}
        {tab === "Calendar" && <ProjectCalendar project={project} />}
        {tab === "Overview" && <ProjectOverview project={project} />}
        {tab === "Settings" && canManage && <ProjectSettings project={project} />}
      </div>
    </div>
  );
};

export default ProjectDetails;
