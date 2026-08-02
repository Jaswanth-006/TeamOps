import { configureStore } from "@reduxjs/toolkit";

// Global state container. Feature reducers (workspace, theme) are registered
// here as they are added.
export const store = configureStore({
  reducer: {},
});
