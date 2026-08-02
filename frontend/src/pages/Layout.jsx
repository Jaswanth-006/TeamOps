import { useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loadTheme } from "../features/themeSlice";

// App shell. The sidebar and navbar are stubbed here and get built out in later
// changes; for now it provides navigation and an outlet for the routed pages.
const Layout = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadTheme());
  }, [dispatch]);

  const linkClass = ({ isActive }) =>
    isActive ? "font-semibold text-blue-600" : "text-gray-600 dark:text-gray-300";

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 dark:text-zinc-100">
      <nav className="flex gap-4 border-b border-gray-200 p-4 dark:border-zinc-800">
        <NavLink to="/" end className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/projects" className={linkClass}>
          Projects
        </NavLink>
        <NavLink to="/team" className={linkClass}>
          Team
        </NavLink>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
