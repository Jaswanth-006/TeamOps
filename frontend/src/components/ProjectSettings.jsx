import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import api from "../configs/api";
import { updateProject } from "../features/workspaceSlice";

// Edit a project's core fields via the API, reflecting the change in the store.
const ProjectSettings = ({ project }) => {
  const dispatch = useDispatch();
  const { currentWorkspace } = useSelector((state) => state.workspace);

  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState(project.status);
  const [progress, setProgress] = useState(project.progress);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/projects", {
        id: project.id,
        workspaceId: currentWorkspace.id,
        name,
        status,
        progress: Number(progress),
        priority: project.priority,
      });
      dispatch(updateProject(data.project));
      toast.success("Project updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md space-y-4 rounded-lg border border-gray-200 p-4 dark:border-zinc-800"
    >
      <div>
        <label className="mb-1 block text-sm text-gray-500 dark:text-zinc-400">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-500 dark:text-zinc-400">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
        >
          {["ACTIVE", "PLANNING", "COMPLETED", "ON_HOLD", "CANCELLED"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-500 dark:text-zinc-400">
          Progress ({progress}%)
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setProgress(e.target.value)}
          className="w-full"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
};

export default ProjectSettings;
