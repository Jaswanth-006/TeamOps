import { useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import api from "../configs/api";
import { addTask } from "../features/workspaceSlice";

// Creates a task in a project via the API, then adds it to the store. The
// assignee must be a project member, so the options come from project.members.
const CreateTaskDialog = ({ project, onClose }) => {
  const dispatch = useDispatch();

  // Assignable people: the team lead plus all team members, de-duplicated. The
  // backend accepts either, so the lead is a valid assignee even before being
  // added as a member.
  const assignees = [];
  if (project.owner) assignees.push(project.owner);
  (project.members || []).forEach((m) => {
    if (!assignees.some((u) => u.id === m.user.id)) assignees.push(m.user);
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState(assignees[0]?.id || "");
  const [priority, setPriority] = useState("MEDIUM");
  const [type, setType] = useState("TASK");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/tasks", {
        projectId: project.id,
        title,
        description,
        assigneeId,
        priority,
        type,
        status: "TODO",
        due_date: dueDate,
      });
      dispatch(addTask(data.task));
      toast.success("Task created");
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 dark:bg-zinc-900"
      >
        <h2 className="text-lg font-semibold">New task</h2>

        {assignees.length === 0 && (
          <p className="rounded bg-amber-50 p-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            Add a member to this team before creating tasks.
          </p>
        )}

        <input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded border border-gray-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded border border-gray-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
        />

        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          required
          className="w-full rounded border border-gray-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="" disabled>
            Assignee
          </option>
          {assignees.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
              {u.id === project.owner?.id ? " (leader)" : ""}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          >
            {["LOW", "MEDIUM", "HIGH"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          >
            {["TASK", "BUG", "FEATURE", "IMPROVEMENT", "OTHER"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
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
            disabled={submitting || assignees.length === 0}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTaskDialog;
