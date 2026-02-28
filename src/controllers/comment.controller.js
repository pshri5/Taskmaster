import { Comment } from "../models/comment.model.js";
import { Task } from "../models/task.model.js";
import {
    Notification,
    NotificationTypeEnum,
} from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/v1/tasks/:taskId/comments
 */
export const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { taskId } = req.params;

    if (!content) {
        throw new ApiError(400, "Comment content is required");
    }

    const task = await Task.findById(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const comment = await Comment.create({
        task: taskId,
        user: req.user._id,
        content,
    });

    const populatedComment = await Comment.findById(comment._id).populate(
        "user",
        "name email"
    );

    // Notify task participants about the new comment
    const usersToNotify = new Set();
    if (task.assignedTo) usersToNotify.add(task.assignedTo.toString());
    if (task.assignedBy) usersToNotify.add(task.assignedBy.toString());
    usersToNotify.delete(req.user._id.toString()); // don't notify yourself

    const io = req.app.get("io");

    for (const userId of usersToNotify) {
        const notification = await Notification.create({
            user: userId,
            type: NotificationTypeEnum.COMMENT_ADDED,
            message: `${req.user.name} commented on "${task.title}"`,
            relatedTask: task._id,
            relatedProject: task.project || null,
        });

        if (io) {
            io.to(userId).emit("notification", notification);
        }
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, populatedComment, "Comment added successfully")
        );
});

/**
 * GET /api/v1/tasks/:taskId/comments
 */
export const getComments = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const task = await Task.findById(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [comments, totalCount] = await Promise.all([
        Comment.find({ task: taskId })
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Comment.countDocuments({ task: taskId }),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    totalCount,
                    totalPages: Math.ceil(totalCount / Number(limit)),
                },
            },
            "Comments fetched successfully"
        )
    );
});

/**
 * PATCH /api/v1/comments/:commentId
 */
export const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { commentId } = req.params;

    if (!content) {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Only the author can update
    if (comment.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only edit your own comments");
    }

    comment.content = content;
    await comment.save();

    const updatedComment = await Comment.findById(comment._id).populate(
        "user",
        "name email"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment updated successfully")
        );
});

/**
 * DELETE /api/v1/comments/:commentId
 */
export const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Only the author can delete
    if (comment.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own comments");
    }

    await Comment.findByIdAndDelete(commentId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});
