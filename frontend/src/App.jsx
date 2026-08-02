import { Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import TaskDetails from "./pages/TaskDetails";
import Team from "./pages/Team";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projectsDetail" element={<ProjectDetails />} />
        <Route path="taskDetails" element={<TaskDetails />} />
        <Route path="team" element={<Team />} />
      </Route>
    </Routes>
  );
};

export default App;
