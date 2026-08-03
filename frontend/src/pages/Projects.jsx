import { useSelector } from "react-redux";
import ProjectCard from "../components/ProjectCard";

// Lists the projects in the current workspace.
const Projects = () => {
  const { currentWorkspace } = useSelector((state) => state.workspace);

  if (!currentWorkspace) {
    return <div className="text-gray-500 dark:text-zinc-400">No workspace selected.</div>;
  }

  const projects = currentWorkspace.projects;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Projects</h1>

      {projects.length === 0 ? (
        <p className="text-gray-500 dark:text-zinc-400">No projects yet.</p>
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
