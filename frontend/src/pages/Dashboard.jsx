import { useState } from "react";
import { useSelector } from "react-redux";
import { Plus } from "lucide-react";
import StatsGrid from "../components/StatsGrid";
import TasksSummary from "../components/TasksSummary";
import RecentActivity from "../components/RecentActivity";
import ProjectAnalytics from "../components/ProjectAnalytics";
import CreateClassDialog from "../components/CreateClassDialog";

// Class overview. Everything is derived from the current class already loaded in
// the store — no extra API calls.
const Dashboard = () => {
  const { currentWorkspace, loading } = useSelector((state) => state.workspace);
  const [showCreate, setShowCreate] = useState(false);

  if (loading) {
    return <div className="text-gray-500 dark:text-zinc-400">Loading...</div>;
  }

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-gray-500 dark:text-zinc-400">
          You're not part of any class yet. Create one to get started.
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="size-4" /> Create a class
        </button>
        {showCreate && <CreateClassDialog onClose={() => setShowCreate(false)} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{currentWorkspace.name}</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          {currentWorkspace.projects.length} teams ·{" "}
          {currentWorkspace.members.length} people
        </p>
      </div>

      <StatsGrid workspace={currentWorkspace} />

      <div className="grid gap-4 lg:grid-cols-2">
        <TasksSummary workspace={currentWorkspace} />
        <RecentActivity workspace={currentWorkspace} />
      </div>

      <ProjectAnalytics workspace={currentWorkspace} />
    </div>
  );
};

export default Dashboard;
