import fs from "fs";
import path from "path";
import { Attachment } from "../models/attachment.model.js";
import { Task } from "../models/task.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/v1/tasks/:taskId/attachments
 * upload one or more files
 */
export const uploadAttachments = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    if (!req.files || req.files.length === 0) {
        throw new ApiError(400, "At least one file is required");
    }

    const attachments = await Attachment.insertMany(
        req.files.map((file) => ({
            task: taskId,
            uploadedBy: req.user._id,
            originalName: file.originalname,
            fileName: file.filename,
            filePath: file.path,
            mimeType: file.mimetype,
            size: file.size,
        }))
    );

    const populated = await Attachment.find({
        _id: { $in: attachments.map((a) => a._id) },
    }).populate("uploadedBy", "name email");

    return res
        .status(201)
        .json(
            new ApiResponse(201, populated, "Attachments uploaded successfully")
        );
});

/**
 * GET /api/v1/tasks/:taskId/attachments
 */
export const getAttachments = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const attachments = await Attachment.find({ task: taskId })
        .populate("uploadedBy", "name email")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(200, attachments, "Attachments fetched successfully")
        );
});

/**
 * GET /api/v1/attachments/:attachmentId/download
 */
export const downloadAttachment = asyncHandler(async (req, res) => {
    const attachment = await Attachment.findById(req.params.attachmentId);
    if (!attachment) {
        throw new ApiError(404, "Attachment not found");
    }

    const absolutePath = path.resolve(attachment.filePath);

    if (!fs.existsSync(absolutePath)) {
        throw new ApiError(404, "File not found on disk");
    }

    res.download(absolutePath, attachment.originalName);
});

/**
 * DELETE /api/v1/attachments/:attachmentId
 */
export const deleteAttachment = asyncHandler(async (req, res) => {
    const attachment = await Attachment.findById(req.params.attachmentId);
    if (!attachment) {
        throw new ApiError(404, "Attachment not found");
    }

    // Only the uploader can delete
    if (attachment.uploadedBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own attachments");
    }

    // Remove file from disk
    const absolutePath = path.resolve(attachment.filePath);
    if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
    }

    await Attachment.findByIdAndDelete(attachment._id);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Attachment deleted successfully"));
});
