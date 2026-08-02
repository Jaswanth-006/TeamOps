import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "../features/themeSlice";

// Global state container. Feature reducers are registered here as they are added.
export const store = configureStore({
  reducer: {
    theme: themeReducer,
  },
});
