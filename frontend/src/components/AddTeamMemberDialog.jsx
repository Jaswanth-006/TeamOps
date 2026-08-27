import { useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import api from "../configs/api";
import { fetchWorkspaces } from "../features/workspaceSlice";

// Adds a person (by email) to a specific team, then reloads the class so the new
// member appears. Allowed for the team lead or the faculty (workspace admin).
const AddTeamMemberDialog = ({ projectId, onClose }) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/addMember`, { email });
      await dispatch(fetchWorkspaces());
      toast.success("Added to team");
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add member");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 dark:bg-zinc-900"
      >
        <h2 className="text-lg font-semibold">Add member to team</h2>

        <input
          type="email"
          placeholder="Person's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded border border-gray-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-sm text-gray-600 dark:text-zinc-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTeamMemberDialog;
