import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../configs/api";

// Load every workspace the user belongs to, with the full nested tree. The auth
// token is attached by the axios interceptor, so no token handling is needed
// here (unlike the external-provider version this replaces).
export const fetchWorkspaces = createAsyncThunk(
  "workspace/fetchWorkspaces",
  async () => {
    const { data } = await api.get("/workspaces");
    return data.workspaces || [];
  }
);

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  loading: false,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setCurrentWorkspace: (state, action) => {
      localStorage.setItem("currentWorkspaceId", action.payload);
      state.currentWorkspace = state.workspaces.find(
        (w) => w.id === action.payload
      );
    },
    addProject: (state, action) => {
      if (!state.currentWorkspace) return;
      state.currentWorkspace.projects.push(action.payload);
      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace.id
          ? { ...w, projects: w.projects.concat(action.payload) }
          : w
      );
    },
    updateProject: (state, action) => {
      const merge = (projects) =>
        projects.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        );
      if (state.currentWorkspace) {
        state.currentWorkspace.projects = merge(state.currentWorkspace.projects);
      }
      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id
          ? { ...w, projects: merge(w.projects) }
          : w
      );
    },
    addTask: (state, action) => {
      const addToProjects = (projects) =>
        projects.map((p) =>
          p.id === action.payload.projectId
            ? { ...p, tasks: p.tasks.concat(action.payload) }
            : p
        );
      if (state.currentWorkspace) {
        state.currentWorkspace.projects = addToProjects(
          state.currentWorkspace.projects
        );
      }
      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id
          ? { ...w, projects: addToProjects(w.projects) }
          : w
      );
    },
    updateTask: (state, action) => {
      const updateInProjects = (projects) =>
        projects.map((p) =>
          p.id === action.payload.projectId
            ? {
                ...p,
                tasks: p.tasks.map((t) =>
                  t.id === action.payload.id ? action.payload : t
                ),
              }
            : p
        );
      if (state.currentWorkspace) {
        state.currentWorkspace.projects = updateInProjects(
          state.currentWorkspace.projects
        );
      }
      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id
          ? { ...w, projects: updateInProjects(w.projects) }
          : w
      );
    },
    deleteTask: (state, action) => {
      const removeFromProjects = (projects) =>
        projects.map((p) => ({
          ...p,
          tasks: p.tasks.filter((t) => !action.payload.includes(t.id)),
        }));
      if (state.currentWorkspace) {
        state.currentWorkspace.projects = removeFromProjects(
          state.currentWorkspace.projects
        );
      }
      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace?.id
          ? { ...w, projects: removeFromProjects(w.projects) }
          : w
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.workspaces = action.payload;
        if (action.payload.length > 0) {
          const savedId = localStorage.getItem("currentWorkspaceId");
          state.currentWorkspace =
            action.payload.find((w) => w.id === savedId) || action.payload[0];
        }
        state.loading = false;
      })
      .addCase(fetchWorkspaces.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const {
  setCurrentWorkspace,
  addProject,
  updateProject,
  addTask,
  updateTask,
  deleteTask,
} = workspaceSlice.actions;
export default workspaceSlice.reducer;
