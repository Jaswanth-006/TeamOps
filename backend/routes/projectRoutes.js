import express from "express";
import { createProject } from "../controllers/projectController.js";

const projectRouter = express.Router();

projectRouter.post("/", createProject);

export default projectRouter;
