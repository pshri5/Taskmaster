import mongoose, { Schema } from "mongoose";
import { AvailableNotificationTypes, NotificationTypeEnum } from "../constants.js";

const notificationSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: AvailableNotificationTypes,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        relatedTask: {
            type: Schema.Types.ObjectId,
            ref: "Task",
            default: null,
        },
        relatedProject: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            default: null,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
export { NotificationTypeEnum };
