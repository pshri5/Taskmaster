import { Notification } from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * GET /api/v1/notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { user: req.user._id };
    if (unreadOnly === "true") {
        filter.isRead = false;
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
        Notification.find(filter)
            .populate("relatedTask", "title status")
            .populate("relatedProject", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Notification.countDocuments(filter),
        Notification.countDocuments({ user: req.user._id, isRead: false }),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                notifications,
                unreadCount,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    totalCount,
                    totalPages: Math.ceil(totalCount / Number(limit)),
                },
            },
            "Notifications fetched successfully"
        )
    );
});

/**
 * PATCH /api/v1/notifications/:notificationId/read
 */
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.notificationId,
        user: req.user._id,
    });

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    notification.isRead = true;
    await notification.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, notification, "Notification marked as read")
        );
});

/**
 * PATCH /api/v1/notifications/read-all
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { user: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "All notifications marked as read")
        );
});
