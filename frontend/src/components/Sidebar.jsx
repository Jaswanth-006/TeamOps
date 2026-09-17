import { NavLink } from "react-router-dom";
import { LayoutDashboard, LayoutGrid, FolderKanban, Users, X } from "lucide-react";
import { useIsFaculty } from "../hooks/useRole";
import ProjectsSidebar from "./ProjectsSidebar";
import MyTasksSidebar from "./MyTasksSidebar";

// Left navigation. Fixed on desktop; slides in as an overlay on mobile driven by
// isSidebarOpen from the layout.
const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const isFaculty = useIsFaculty();
  const close = () => setIsSidebarOpen(false);

  // Class Overview is a faculty-only orchestration view.
  const links = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    ...(isFaculty ? [{ to: "/class", label: "Class Overview", icon: LayoutGrid }] : []),
    { to: "/projects", label: isFaculty ? "Teams" : "My Teams", icon: FolderKanban },
    { to: "/team", label: "People", icon: Users },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
      isActive
        ? "bg-blue-50 font-medium text-blue-600 dark:bg-zinc-800 dark:text-blue-400"
        : "text-gray-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
    }`;

  const content = (
    <>
      <div className="mb-6 flex items-center justify-between">
        <span className="text-lg font-bold">TeamOps</span>
        <button
          className="md:hidden"
          onClick={close}
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass} onClick={close}>
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <ProjectsSidebar onNavigate={close} />
      <MyTasksSidebar onNavigate={close} />
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden h-screen w-60 shrink-0 overflow-y-auto border-r border-gray-200 p-4 dark:border-zinc-800 md:block">
        {content}
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-60 bg-white p-4 dark:bg-zinc-950">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
