import express from "express";
import {
  getUserWorkspaces,
  createWorkspace,
  addMember,
} from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.get("/", getUserWorkspaces);
workspaceRouter.post("/", createWorkspace);
workspaceRouter.post("/add-member", addMember);

export default workspaceRouter;
