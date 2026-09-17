import { useState } from "react";
import { useSelector } from "react-redux";
import { Plus } from "lucide-react";
import ProjectCard from "../components/ProjectCard";
import CreateProjectDialog from "../components/CreateProjectDialog";
import { useIsFaculty } from "../hooks/useRole";

// Lists the teams the user can see (faculty: all; student: their own).
const Projects = () => {
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const [showCreate, setShowCreate] = useState(false);
  const isFaculty = useIsFaculty();

  if (!currentWorkspace) {
    return <div className="text-gray-500 dark:text-zinc-400">No workspace selected.</div>;
  }

  const projects = currentWorkspace.projects;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isFaculty ? "Teams" : "My Teams"}</h1>
        {isFaculty && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="size-4" /> New team
          </button>
        )}
      </div>

      {showCreate && <CreateProjectDialog onClose={() => setShowCreate(false)} />}

      {projects.length === 0 ? (
        <p className="text-gray-500 dark:text-zinc-400">No teams yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
