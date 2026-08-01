import express from "express";
import { getUserWorkspaces } from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.get("/", getUserWorkspaces);

export default workspaceRouter;
