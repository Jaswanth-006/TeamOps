import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "../features/themeSlice";
import workspaceReducer from "../features/workspaceSlice";

// Global state container. Feature reducers are registered here as they are added.
export const store = configureStore({
  reducer: {
    theme: themeReducer,
    workspace: workspaceReducer,
  },
});
