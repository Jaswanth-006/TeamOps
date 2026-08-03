import { useDispatch, useSelector } from "react-redux";
import { Menu, Sun, Moon, LogOut } from "lucide-react";
import { toggleTheme } from "../features/themeSlice";
import { useAuth } from "../context/AuthContext";
import WorkspaceDropdown from "./WorkspaceDropdown";

// Top bar: mobile menu button, a workspace switcher placeholder (wired to real
// data in the workspace change), theme toggle, current user, and logout.
const Navbar = ({ setIsSidebarOpen }) => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.theme);
  const { user, logout } = useAuth();

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
          <span className="hidden text-sm text-gray-700 dark:text-zinc-300 sm:inline">
            {user.name}
          </span>
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
