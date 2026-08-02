import { createSlice } from "@reduxjs/toolkit";

// Apply the theme to the document root and remember the choice.
const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem("theme", theme);
};

const initialState = {
  theme: localStorage.getItem("theme") || "light",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    loadTheme: (state) => {
      applyTheme(state.theme);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      applyTheme(state.theme);
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      applyTheme(state.theme);
    },
  },
});

export const { loadTheme, toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
