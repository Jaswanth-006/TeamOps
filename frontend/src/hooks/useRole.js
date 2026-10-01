import { useAuth } from "../context/AuthContext";
import { useSelector } from "react-redux";

// Is the current user a faculty account? This is the account-level role set at
// sign-up, so it holds even before a class is loaded.
export function useIsFaculty() {
  const { user } = useAuth();
  return user?.role === "FACULTY";
}

// Can the current user manage a given team? Faculty (class admin) can manage any
// team; a team leader can manage their own. Mirrors the backend's rule.
export function useCanManageProject(project) {
  const { user } = useAuth();
  const isFaculty = useIsFaculty();
  const { currentWorkspace } = useSelector((state) => state.workspace);
  
  const isWorkspaceAdmin = currentWorkspace?.members?.some(
    (m) => m.userId === user?.id && m.role === "ADMIN"
  );

  return isFaculty || isWorkspaceAdmin || project?.team_lead === user?.id;
}
