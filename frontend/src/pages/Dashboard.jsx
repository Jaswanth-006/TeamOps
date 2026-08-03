import { useSelector } from "react-redux";
import StatsGrid from "../components/StatsGrid";

// Workspace overview. Everything is derived from the current workspace already
// loaded in the store — no extra API calls.
const Dashboard = () => {
  const { currentWorkspace, loading } = useSelector((state) => state.workspace);

  if (loading) {
    return <div className="text-gray-500 dark:text-zinc-400">Loading...</div>;
  }

  if (!currentWorkspace) {
    return (
      <div className="text-gray-500 dark:text-zinc-400">
        No workspace yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{currentWorkspace.name}</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          {currentWorkspace.projects.length} projects ·{" "}
          {currentWorkspace.members.length} members
        </p>
      </div>

      <StatsGrid workspace={currentWorkspace} />
    </div>
  );
};

export default Dashboard;
