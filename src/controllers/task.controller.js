import { Task } from "../models/task.model.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import {
    Notification,
    NotificationTypeEnum,
} from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/v1/tasks
 */
export const createTask = asyncHandler(async (req, res) => {
    const { title, description, dueDate, project, assignedTo } = req.body;

    if (!title) {
        throw new ApiError(400, "Task title is required");
    }

    // If project is specified, verify the creator is a member
    if (project) {
        const membership = await ProjectMember.findOne({
            user: req.user._id,
            project,
        });
        if (!membership) {
            throw new ApiError(
                403,
                "You must be a member of the project to create tasks"
            );
        }
    }

    const task = await Task.create({
        title,
        description,
        dueDate: dueDate || null,
        project: project || null,
        assignedTo: assignedTo || null,
        assignedBy: req.user._id,
    });

    // Send notification if task is assigned to someone else
    if (assignedTo && assignedTo !== req.user._id.toString()) {
        const notification = await Notification.create({
            user: assignedTo,
            type: NotificationTypeEnum.TASK_ASSIGNED,
            message: `${req.user.name} assigned you a task: "${title}"`,
            relatedTask: task._id,
            relatedProject: project || null,
        });

        const io = req.app.get("io");
        if (io) {
            io.to(assignedTo).emit("notification", notification);
        }
    }

    const populatedTask = await Task.findById(task._id)
        .populate("assignedTo", "name email")
        .populate("assignedBy", "name email")
        .populate("project", "name");

    return res
        .status(201)
        .json(new ApiResponse(201, populatedTask, "Task created successfully"));
});

/**
 * GET /api/v1/tasks
 * Query params: status, assignedTo, project, search, sortBy, order, page, limit
 */
export const getTasks = asyncHandler(async (req, res) => {
    const {
        status,
        assignedTo,
        project,
        search,
        sortBy = "createdAt",
        order = "desc",
        page = 1,
        limit = 20,
    } = req.query;

    const filter = {};

    // Only show tasks the user is involved in (assigned to or created by)
    // unless filtering by project
    if (project) {
        filter.project = project;
    } else {
        filter.$or = [
            { assignedTo: req.user._id },
            { assignedBy: req.user._id },
        ];
    }

    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (search) {
        filter.$and = [
            ...(filter.$and || []),
            {
                $or: [
                    { title: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                ],
            },
        ];
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const skip = (Number(page) - 1) * Number(limit);

    const [tasks, totalCount] = await Promise.all([
        Task.find(filter)
            .populate("assignedTo", "name email")
            .populate("assignedBy", "name email")
            .populate("project", "name")
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(Number(limit)),
        Task.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                tasks,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    totalCount,
                    totalPages: Math.ceil(totalCount / Number(limit)),
                },
            },
            "Tasks fetched successfully"
        )
    );
});

/**
 * GET /api/v1/tasks/:taskId
 */
export const getTaskById = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.taskId)
        .populate("assignedTo", "name email")
        .populate("assignedBy", "name email")
        .populate("project", "name");

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, task, "Task fetched successfully"));
});

/**
 * PATCH /api/v1/tasks/:taskId
 */
export const updateTask = asyncHandler(async (req, res) => {
    const { title, description, dueDate, assignedTo, status } = req.body;

    const task = await Task.findById(req.params.taskId);
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    // Only the creator or the assignee can update the task
    if (
        task.assignedBy.toString() !== req.user._id.toString() &&
        task.assignedTo?.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, "You are not authorized to update this task");
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (dueDate !== undefined) updateFields.dueDate = dueDate;
    if (status !== undefined) updateFields.status = status;

    // Handle reassignment
    if (assignedTo !== undefined) {
        updateFields.assignedTo = assignedTo;

        if (assignedTo && assignedTo !== req.user._id.toString()) {
            const notification = await Notification.create({
                user: assignedTo,
                type: NotificationTypeEnum.TASK_ASSIGNED,
                message: `${req.user.name} assigned you a task: "${task.title}"`,
                relatedTask: task._id,
                relatedProject: task.project || null,
            });

            const io = req.app.get("io");
            if (io) {
                io.to(assignedTo).emit("notification", notification);
            }
        }
    }

    const updatedTask = await Task.findByIdAndUpdate(
        req.params.taskId,
        { $set: updateFields },
        { new: true, runValidators: true }
    )
        .populate("assignedTo", "name email")
        .populate("assignedBy", "name email")
        .populate("project", "name");

    // Notify relevant users about task update
    const notifyUser =
        task.assignedTo?.toString() !== req.user._id.toString()
            ? task.assignedTo
            : task.assignedBy.toString() !== req.user._id.toString()
                ? task.assignedBy
                : null;

    if (notifyUser) {
        const notification = await Notification.create({
            user: notifyUser,
            type: NotificationTypeEnum.TASK_UPDATED,
            message: `${req.user.name} updated the task: "${updatedTask.title}"`,
            relatedTask: task._id,
            relatedProject: task.project || null,
        });

        const io = req.app.get("io");
        if (io) {
            io.to(notifyUser.toString()).emit("notification", notification);
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
});

/**
 * DELETE /api/v1/tasks/:taskId
 */
export const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    // Only the creator can delete the task
    if (task.assignedBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the task creator can delete this task");
    }

    await Task.findByIdAndDelete(req.params.taskId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Task deleted successfully"));
});

/**
 * PATCH /api/v1/tasks/:taskId/status
 */
export const updateTaskStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!status) {
        throw new ApiError(400, "Status is required");
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    // Only the creator or assignee can change status
    if (
        task.assignedBy.toString() !== req.user._id.toString() &&
        task.assignedTo?.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You are not authorized to update this task's status"
        );
    }

    task.status = status;
    await task.save({ validateBeforeSave: true });

    const updatedTask = await Task.findById(task._id)
        .populate("assignedTo", "name email")
        .populate("assignedBy", "name email")
        .populate("project", "name");

    // Notify the other party
    const notifyUser =
        task.assignedTo?.toString() !== req.user._id.toString()
            ? task.assignedTo
            : task.assignedBy.toString() !== req.user._id.toString()
                ? task.assignedBy
                : null;

    if (notifyUser) {
        const notification = await Notification.create({
            user: notifyUser,
            type: NotificationTypeEnum.TASK_UPDATED,
            message: `${req.user.name} moved "${task.title}" to ${status}`,
            relatedTask: task._id,
            relatedProject: task.project || null,
        });

        const io = req.app.get("io");
        if (io) {
            io.to(notifyUser.toString()).emit("notification", notification);
        }
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedTask, "Task status updated successfully")
        );
});
