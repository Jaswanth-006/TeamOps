import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Month grid placing each task on its due date.
const ProjectCalendar = ({ project }) => {
  const [month, setMonth] = useState(new Date());
  const tasks = project.tasks || [];

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  const tasksOn = (day) =>
    tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), day));

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setMonth(subMonths(month, 1))} aria-label="Previous month">
          <ChevronLeft className="size-5" />
        </button>
        <h3 className="text-sm font-semibold">{format(month, "MMMM yyyy")}</h3>
        <button onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-zinc-400">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1 font-medium">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const dayTasks = tasksOn(day);
          return (
            <div
              key={day.toISOString()}
              className={`min-h-16 rounded border p-1 text-left ${
                isSameMonth(day, month)
                  ? "border-gray-200 dark:border-zinc-800"
                  : "border-transparent text-gray-300 dark:text-zinc-700"
              }`}
            >
              <span>{format(day, "d")}</span>
              {dayTasks.map((t) => (
                <p
                  key={t.id}
                  className="mt-0.5 truncate rounded bg-blue-100 px-1 text-[10px] text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  title={t.title}
                >
                  {t.title}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectCalendar;
