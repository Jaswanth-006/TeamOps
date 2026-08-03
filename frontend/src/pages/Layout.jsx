import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loadTheme } from "../features/themeSlice";
import { fetchWorkspaces } from "../features/workspaceSlice";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

// App shell: a sidebar column and a main column with a top navbar and a
// scrollable content area where routed pages render.
const Layout = () => {
  const dispatch = useDispatch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    dispatch(loadTheme());
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  return (
    <div className="flex h-screen bg-white text-gray-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex flex-1 flex-col">
        <Navbar setIsSidebarOpen={setIsSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
