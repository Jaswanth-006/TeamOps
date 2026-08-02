import { Outlet, NavLink } from "react-router-dom";

// App shell. The sidebar and navbar are stubbed here and get built out in later
// changes; for now it provides navigation and an outlet for the routed pages.
const Layout = () => {
  const linkClass = ({ isActive }) =>
    isActive ? "font-semibold text-blue-600" : "text-gray-600";

  return (
    <div className="min-h-screen">
      <nav className="flex gap-4 border-b border-gray-200 p-4">
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
