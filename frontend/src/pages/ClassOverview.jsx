import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

// Faculty high-level view: every team in the class at a glance — leader, size,
// task progress, and status. Derived from the workspace tree already in the
// store, so no extra API call is needed.
const ClassOverview = () => {
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const navigate = useNavigate();

  if (!currentWorkspace) {
    return <div className="text-gray-500 dark:text-zinc-400">No class selected.</div>;
  }

  const teams = currentWorkspace.projects;
  const totalTasks = teams.reduce((n, t) => n + (t.tasks?.length || 0), 0);
  const totalDone = teams.reduce(
    (n, t) => n + (t.tasks || []).filter((k) => k.status === "DONE").length,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{currentWorkspace.name}</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          {teams.length} teams · {totalDone}/{totalTasks} tasks completed across the class
        </p>
      </div>

      {teams.length === 0 ? (
        <p className="text-gray-500 dark:text-zinc-400">No teams yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="p-3 font-medium">Team</th>
                <th className="p-3 font-medium">Leader</th>
                <th className="p-3 font-medium">Members</th>
                <th className="p-3 font-medium">Tasks (done / total)</th>
                <th className="p-3 font-medium">Progress</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const tasks = team.tasks || [];
                const done = tasks.filter((t) => t.status === "DONE").length;
                const pct = tasks.length
                  ? Math.round((done / tasks.length) * 100)
                  : 0;
                return (
                  <tr
                    key={team.id}
                    onClick={() =>
                      navigate(`/projectsDetail?projectId=${team.id}`)
                    }
                    className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  >
                    <td className="p-3 font-medium">{team.name}</td>
                    <td className="p-3">{team.owner?.name || "—"}</td>
                    <td className="p-3">{team.members?.length || 0}</td>
                    <td className="p-3">
                      {done} / {tasks.length}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded bg-gray-200 dark:bg-zinc-700">
                          <div
                            className="h-1.5 rounded bg-blue-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{pct}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                        {team.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClassOverview;
