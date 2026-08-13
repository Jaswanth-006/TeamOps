import { useEffect, useState } from "react";
import { format } from "date-fns";
import { MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../configs/api";

// Loads and posts comments for a task. Refetches after posting so the new
// comment appears with its author.
const TaskComments = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/comments/${taskId}`);
      setComments(data.comments || []);
    } catch {
      // Non-fatal: leave the list empty on load failure.
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      await api.post("/comments", { taskId, content });
      setContent("");
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add comment");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-zinc-800">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <MessageCircle className="size-4" /> Comments ({comments.length})
      </h2>

      <div className="mb-4 space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            No comments yet. Be the first.
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="rounded border border-gray-200 p-3 dark:border-zinc-700"
            >
              <div className="mb-1 flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                <span className="font-medium text-gray-900 dark:text-white">
                  {c.user?.name}
                </span>
                <span>· {format(new Date(c.createdAt), "dd MMM yyyy, HH:mm")}</span>
              </div>
              <p className="text-sm text-gray-800 dark:text-zinc-200">{c.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          rows={2}
          className="flex-1 rounded border border-gray-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button
          onClick={handlePost}
          disabled={posting}
          className="self-end rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {posting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
};

export default TaskComments;
