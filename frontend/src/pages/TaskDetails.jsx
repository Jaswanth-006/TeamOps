import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import { CalendarIcon, MessageCircle, PenIcon, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../configs/api";
import { updateTask, deleteTask } from "../features/workspaceSlice";
import { useAuth } from "../context/AuthContext";
import { useCanManageProject } from "../hooks/useRole";
import Avatar from "../components/Avatar";

const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];

// Task detail: a two-column view — the discussion (chat) on the left, and the
// task and team info on the right. Comments load on open and refresh live.
const TaskDetails = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const taskId = searchParams.get("taskId");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspace } = useSelector((state) => state.workspace);

  const project = currentWorkspace?.projects.find((p) => p.id === projectId);
  const task = project?.tasks.find((t) => t.id === taskId);
  const canManage = useCanManageProject(project);
  const isAssignee = task?.assigneeId === user?.id;
  const canSetStatus = canManage || isAssignee;

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const scrollRef = useRef(null);

  const loadComments = async () => {
    if (!taskId) return;
    try {
      const { data } = await api.get(`/comments/${taskId}`);
      setComments(data.comments || []);
    } catch {
      /* leave existing comments on a transient failure */
    }
  };

  // Load on open, then poll so new messages from teammates appear.
  useEffect(() => {
    loadComments();
    const interval = setInterval(loadComments, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [comments]);

  if (!project || !task) {
    return <div className="text-red-500">Task not found.</div>;
  }

  const postComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      await api.post("/comments", { taskId, content: newComment });
      setNewComment("");
      await loadComments();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add comment");
    } finally {
      setPosting(false);
    }
  };

  const changeStatus = async (status) => {
    if (status === task.status) return;
    setUpdating(true);
    try {
      const { data } = await api.put(`/tasks/${task.id}`, { status });
      dispatch(updateTask({ ...data.task, projectId: project.id }));
      toast.success(`Moved to ${status.replace("_", " ")}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update task");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.post("/tasks/delete", { tasksIds: [task.id] });
      dispatch(deleteTask([task.id]));
      toast.success("Task deleted");
      navigate(`/projectsDetail?projectId=${project.id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete task");
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
      {/* Left: discussion / chat */}
      <div className="w-full lg:w-2/3">
        <div className="flex flex-col rounded-lg border border-gray-200 p-5 dark:border-zinc-800 lg:h-[78vh]">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <MessageCircle className="size-5" /> Discussion ({comments.length})
          </h2>

          <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-zinc-500">
                No messages yet. Start the discussion.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {comments.map((c) => {
                  const mine = c.user?.id === user?.id;
                  return (
                    <div
                      key={c.id}
                      className={`max-w-[85%] rounded-lg border border-gray-200 p-3 dark:border-zinc-700 ${
                        mine
                          ? "ml-auto bg-blue-50 dark:bg-zinc-800"
                          : "mr-auto bg-white dark:bg-zinc-900"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                        <Avatar name={c.user?.name} className="size-5 text-[10px]" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {c.user?.name}
                        </span>
                        <span>· {format(new Date(c.createdAt), "dd MMM, HH:mm")}</span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-zinc-200">
                        {c.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-end gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a message..."
              rows={2}
              className="flex-1 resize-none rounded border border-gray-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <button
              onClick={postComment}
              disabled={posting}
              className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {posting ? "..." : "Post"}
            </button>
          </div>
        </div>
      </div>

      {/* Right: task + team info */}
      <div className="flex w-full flex-col gap-6 lg:w-1/3">
        <div className="rounded-lg border border-gray-200 p-5 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg font-semibold">{task.title}</h1>
            {canManage && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 dark:text-zinc-400"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
              {task.status}
            </span>
            <span className="rounded bg-blue-200 px-2 py-0.5 text-xs text-blue-900 dark:bg-blue-900 dark:text-blue-300">
              {task.type}
            </span>
            <span className="rounded bg-green-200 px-2 py-0.5 text-xs text-green-900 dark:bg-emerald-900 dark:text-emerald-300">
              {task.priority}
            </span>
          </div>

          {task.description && (
            <p className="mt-4 text-sm text-gray-600 dark:text-zinc-400">
              {task.description}
            </p>
          )}

          {canSetStatus && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-zinc-400">Status:</span>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  disabled={updating}
                  className={`rounded px-2 py-1 text-xs ${
                    s === task.status
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          )}

          <hr className="my-4 border-gray-200 dark:border-zinc-700" />

          <div className="space-y-2 text-sm text-gray-700 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              <Avatar name={task.assignee?.name} className="size-5 text-[10px]" />
              {task.assignee?.name || "Unassigned"}
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-gray-500" />
              Due {format(new Date(task.due_date), "dd MMM yyyy")}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 dark:border-zinc-800">
          <p className="mb-2 flex items-center gap-2 font-medium">
            <PenIcon className="size-4" /> {project.name}
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-zinc-400">
            <span>Leader: {project.owner?.name || "—"}</span>
            <span>Status: {project.status}</span>
            <span>Progress: {project.progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
