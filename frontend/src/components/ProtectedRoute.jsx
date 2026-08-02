import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Gates the app for signed-in users. While the session is being restored it
// shows a loading state; with no user it redirects to login. This is a UX guard
// — the real enforcement is server-side on every API request.
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
