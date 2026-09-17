import { useDispatch, useSelector } from "react-redux";
import { Menu, Sun, Moon, LogOut } from "lucide-react";
import { toggleTheme } from "../features/themeSlice";
import { useAuth } from "../context/AuthContext";
import { useIsFaculty } from "../hooks/useRole";
import WorkspaceDropdown from "./WorkspaceDropdown";

// Top bar: mobile menu button, class switcher, theme toggle, a role badge, the
// current user, and logout.
const Navbar = ({ setIsSidebarOpen }) => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.theme);
  const { user, logout } = useAuth();
  const isFaculty = useIsFaculty();

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-zinc-800 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <WorkspaceDropdown />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch(toggleTheme())}
          aria-label="Toggle theme"
          className="text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
        >
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>

        {user && (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-gray-700 dark:text-zinc-300">
              {user.name}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isFaculty
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              }`}
            >
              {isFaculty ? "Faculty" : "Student"}
            </span>
          </div>
        )}

        <button
          onClick={logout}
          aria-label="Log out"
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 dark:text-zinc-400"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
