import express from "express";
import { createTask, updateTask } from "../controllers/taskController.js";

const taskRouter = express.Router();

taskRouter.post("/", createTask);
taskRouter.put("/:id", updateTask);

export default taskRouter;
