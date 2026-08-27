import { useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import api from "../configs/api";
import { addWorkspace } from "../features/workspaceSlice";

// Creates a class (workspace) via the API and adds it to the store, making it the
// current class. The creator becomes the faculty (workspace admin).
const CreateClassDialog = ({ onClose }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/workspaces", { name, description });
      dispatch(addWorkspace(data.workspace));
      toast.success("Class created");
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create class");
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
        <h2 className="text-lg font-semibold">New class</h2>

        <input
          placeholder="Class name (e.g. CSE Sem 5 - Cloud Computing)"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
            {submitting ? "Creating..." : "Create class"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateClassDialog;
