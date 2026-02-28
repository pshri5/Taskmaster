import { Router } from "express";
import {
    uploadAttachments,
    getAttachments,
    downloadAttachment,
    deleteAttachment,
} from "../controllers/attachment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// All attachment routes are protected
router.use(verifyJWT);

// Task-scoped routes
router
    .route("/tasks/:taskId/attachments")
    .post(upload.array("attachments", 5), uploadAttachments)
    .get(getAttachments);

// Attachment-specific routes
router.get("/attachments/:attachmentId/download", downloadAttachment);
router.delete("/attachments/:attachmentId", deleteAttachment);

export default router;
