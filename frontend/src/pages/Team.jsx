import { useState } from "react";
import { useSelector } from "react-redux";
import { UserPlus } from "lucide-react";
import InviteMemberDialog from "../components/InviteMemberDialog";

// Lists the current workspace's members and their roles, with an add-member action.
const Team = () => {
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const [showInvite, setShowInvite] = useState(false);

  if (!currentWorkspace) {
    return <div className="text-gray-500 dark:text-zinc-400">No workspace selected.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team</h1>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <UserPlus className="size-4" /> Add member
        </button>
      </div>

      {showInvite && <InviteMemberDialog onClose={() => setShowInvite(false)} />}

      <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-zinc-800 dark:border-zinc-800">
        {currentWorkspace.members.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{m.user.name}</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{m.user.email}</p>
            </div>
            <span
              className={`rounded px-2 py-0.5 text-xs ${
                m.role === "ADMIN"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {m.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Team;
