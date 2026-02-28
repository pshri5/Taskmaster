import { Router } from "express";
import {
    addComment,
    getComments,
    updateComment,
    deleteComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All comment routes are protected
router.use(verifyJWT);

// Task-scoped comment routes
router.route("/tasks/:taskId/comments").post(addComment).get(getComments);

// Comment-specific routes
router
    .route("/comments/:commentId")
    .patch(updateComment)
    .delete(deleteComment);

export default router;
