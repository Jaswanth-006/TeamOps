import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { allTasks } from "../utils/workspace";

const STATUS_ORDER = ["TODO", "IN_PROGRESS", "DONE"];
const PRIORITY_ORDER = ["LOW", "MEDIUM", "HIGH"];
const PIE_COLORS = ["#a3a3a3", "#3b82f6", "#10b981"];

const countBy = (tasks, field, keys) =>
  keys.map((key) => ({
    name: key.replace("_", " "),
    value: tasks.filter((t) => t[field] === key).length,
  }));

// Task distribution charts for the current workspace.
const ProjectAnalytics = ({ workspace }) => {
  const tasks = allTasks(workspace);
  const byStatus = countBy(tasks, "status", STATUS_ORDER);
  const byPriority = countBy(tasks, "priority", PRIORITY_ORDER);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-gray-200 p-4 dark:border-zinc-800">
        <h2 className="mb-4 text-sm font-semibold">Tasks by status</h2>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={80} label>
              {byStatus.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 dark:border-zinc-800">
        <h2 className="mb-4 text-sm font-semibold">Tasks by priority</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byPriority}>
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis allowDecimals={false} stroke="#9ca3af" fontSize={12} />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProjectAnalytics;
