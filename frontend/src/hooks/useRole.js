import { useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";

// Is the current user the faculty (ADMIN) of the current class?
export function useIsFaculty() {
  const { user } = useAuth();
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const membership = currentWorkspace?.members?.find(
    (m) => m.userId === user?.id
  );
  return membership?.role === "ADMIN";
}

// Can the current user manage a given team? Faculty (class admin) can manage any
// team; a team leader can manage their own. Mirrors the backend's rule.
export function useCanManageProject(project) {
  const { user } = useAuth();
  const isFaculty = useIsFaculty();
  return isFaculty || project?.team_lead === user?.id;
}
