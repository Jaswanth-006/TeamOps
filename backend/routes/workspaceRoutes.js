import express from "express";
import {
  getUserWorkspaces,
  addMember,
} from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.get("/", getUserWorkspaces);
workspaceRouter.post("/add-member", addMember);

export default workspaceRouter;
