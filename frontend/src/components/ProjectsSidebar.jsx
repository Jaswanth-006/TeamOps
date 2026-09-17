import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ChevronRight,
  KanbanSquare,
  ChartColumn,
  Calendar,
  Settings,
} from "lucide-react";

const subItems = [
  { title: "Tasks", tab: "tasks", icon: KanbanSquare },
  { title: "Analytics", tab: "analytics", icon: ChartColumn },
  { title: "Calendar", tab: "calendar", icon: Calendar },
  { title: "Settings", tab: "settings", icon: Settings },
];

// Sidebar tree of the teams the user can see; each expands to the team's tabs.
const ProjectsSidebar = ({ onNavigate }) => {
  const projects = useSelector(
    (state) => state.workspace.currentWorkspace?.projects || []
  );
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
          Teams
        </span>
      </div>

      <div className="space-y-1">
        {projects.length === 0 ? (
          <p className="px-3 py-1 text-xs text-gray-500 dark:text-zinc-500">
            No teams yet.
          </p>
        ) : (
          projects.map((p) => (
            <div key={p.id}>
              <button
                onClick={() => toggle(p.id)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <ChevronRight
                  className={`size-3 shrink-0 transition-transform ${
                    expanded[p.id] ? "rotate-90" : ""
                  }`}
                />
                <span className="size-2 shrink-0 rounded-full bg-blue-500" />
                <span className="truncate">{p.name}</span>
              </button>

              {expanded[p.id] && (
                <div className="ml-6 mt-1 space-y-1">
                  {subItems.map((s) => (
                    <Link
                      key={s.tab}
                      to={`/projectsDetail?projectId=${p.id}&tab=${s.tab}`}
                      onClick={onNavigate}
                      className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                    >
                      <s.icon className="size-3" />
                      {s.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectsSidebar;
