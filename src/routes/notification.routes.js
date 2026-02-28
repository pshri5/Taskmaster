import { Router } from "express";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All notification routes are protected
router.use(verifyJWT);

router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:notificationId/read", markAsRead);

export default router;
