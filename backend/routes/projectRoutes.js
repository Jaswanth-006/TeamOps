import express from "express";
import {
  createProject,
  updateProject,
} from "../controllers/projectController.js";

const projectRouter = express.Router();

projectRouter.post("/", createProject);
projectRouter.put("/", updateProject);

export default projectRouter;
