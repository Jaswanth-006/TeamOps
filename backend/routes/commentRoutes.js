import express from "express";
import { addComment } from "../controllers/commentController.js";

const commentRouter = express.Router();

commentRouter.post("/", addComment);

export default commentRouter;
