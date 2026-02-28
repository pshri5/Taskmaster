import { Router } from "express";
import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    updateTaskStatus,
} from "../controllers/task.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All task routes are protected
router.use(verifyJWT);

router.route("/").post(createTask).get(getTasks);

router
    .route("/:taskId")
    .get(getTaskById)
    .patch(updateTask)
    .delete(deleteTask);

router.patch("/:taskId/status", updateTaskStatus);

export default router;
