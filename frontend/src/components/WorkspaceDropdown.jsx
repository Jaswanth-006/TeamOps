import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDown, Check } from "lucide-react";
import { setCurrentWorkspace } from "../features/workspaceSlice";

// Switches the current workspace. Reads the list from the store and dispatches
// the selection, which is also persisted to local storage by the reducer.
const WorkspaceDropdown = () => {
  const dispatch = useDispatch();
  const { workspaces, currentWorkspace } = useSelector((state) => state.workspace);
  const [open, setOpen] = useState(false);

  if (!currentWorkspace) return null;

  const select = (id) => {
    dispatch(setCurrentWorkspace(id));
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800"
      >
        {currentWorkspace.name}
        <ChevronDown className="size-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-1 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => select(w.id)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
              >
                {w.name}
                {w.id === currentWorkspace.id && <Check className="size-4 text-blue-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default WorkspaceDropdown;
