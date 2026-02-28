import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import { User } from "../models/user.model.js";
import {
    Notification,
    NotificationTypeEnum,
} from "../models/notification.model.js";
import { UserRoleEnum } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/v1/projects
 */
export const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        throw new ApiError(400, "Project name is required");
    }

    const project = await Project.create({
        name,
        description,
        createdBy: req.user._id,
    });

    // Automatically add creator as project-admin
    await ProjectMember.create({
        user: req.user._id,
        project: project._id,
        role: UserRoleEnum.PROJECT_ADMIN,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, project, "Project created successfully"));
});

/**
 * GET /api/v1/projects
 */
export const getProjects = asyncHandler(async (req, res) => {
    // Find all projects the user is a member of
    const memberships = await ProjectMember.find({
        user: req.user._id,
    }).select("project");

    const projectIds = memberships.map((m) => m.project);

    const projects = await Project.find({
        _id: { $in: projectIds },
    })
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

/**
 * GET /api/v1/projects/:projectId
 */
export const getProjectById = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.projectId).populate(
        "createdBy",
        "name email"
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Verify user is a member
    const membership = await ProjectMember.findOne({
        user: req.user._id,
        project: project._id,
    });

    if (!membership) {
        throw new ApiError(403, "You are not a member of this project");
    }

    const memberCount = await ProjectMember.countDocuments({
        project: project._id,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { ...project.toObject(), memberCount },
                "Project fetched successfully"
            )
        );
});

/**
 * PATCH /api/v1/projects/:projectId
 */
export const updateProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const project = await Project.findById(req.params.projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Only project-admin can update
    const membership = await ProjectMember.findOne({
        user: req.user._id,
        project: project._id,
        role: UserRoleEnum.PROJECT_ADMIN,
    });

    if (!membership) {
        throw new ApiError(403, "Only project admins can update the project");
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    await project.save();

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project updated successfully"));
});

/**
 * DELETE /api/v1/projects/:projectId
 */
export const deleteProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Only the creator can delete
    if (project.createdBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the project creator can delete it");
    }

    // Cleanup members
    await ProjectMember.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Project deleted successfully"));
});

/**
 * POST /api/v1/projects/:projectId/members
 * Body: { userId, role? }
 */
export const addMember = asyncHandler(async (req, res) => {
    const { userId, role } = req.body;

    if (!userId) {
        throw new ApiError(400, "userId is required");
    }

    const project = await Project.findById(req.params.projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Only project-admin can add members
    const adminMembership = await ProjectMember.findOne({
        user: req.user._id,
        project: project._id,
        role: UserRoleEnum.PROJECT_ADMIN,
    });

    if (!adminMembership) {
        throw new ApiError(403, "Only project admins can add members");
    }

    // Check if user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
        throw new ApiError(404, "User not found");
    }

    // Check if already a member
    const existingMembership = await ProjectMember.findOne({
        user: userId,
        project: project._id,
    });

    if (existingMembership) {
        throw new ApiError(409, "User is already a member of this project");
    }

    const membership = await ProjectMember.create({
        user: userId,
        project: project._id,
        role: role || UserRoleEnum.MEMBER,
    });

    // Notify the added user
    const notification = await Notification.create({
        user: userId,
        type: NotificationTypeEnum.PROJECT_INVITATION,
        message: `${req.user.name} added you to the project "${project.name}"`,
        relatedProject: project._id,
    });

    const io = req.app.get("io");
    if (io) {
        io.to(userId).emit("notification", notification);
    }

    const populatedMembership = await ProjectMember.findById(membership._id)
        .populate("user", "name email")
        .populate("project", "name");

    return res
        .status(200)
        .json(
            new ApiResponse(200, populatedMembership, "Member added successfully")
        );
});

/**
 * DELETE /api/v1/projects/:projectId/members/:userId
 */
export const removeMember = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Only project-admin can remove members (or user removing themselves)
    if (req.user._id.toString() !== userId) {
        const adminMembership = await ProjectMember.findOne({
            user: req.user._id,
            project: project._id,
            role: UserRoleEnum.PROJECT_ADMIN,
        });

        if (!adminMembership) {
            throw new ApiError(403, "Only project admins can remove members");
        }
    }

    // Cannot remove the project creator
    if (project.createdBy.toString() === userId) {
        throw new ApiError(400, "Cannot remove the project creator");
    }

    const membership = await ProjectMember.findOneAndDelete({
        user: userId,
        project: project._id,
    });

    if (!membership) {
        throw new ApiError(404, "User is not a member of this project");
    }

    // Notify the removed user
    if (req.user._id.toString() !== userId) {
        const notification = await Notification.create({
            user: userId,
            type: NotificationTypeEnum.MEMBER_REMOVED,
            message: `You were removed from the project "${project.name}"`,
            relatedProject: project._id,
        });

        const io = req.app.get("io");
        if (io) {
            io.to(userId).emit("notification", notification);
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Member removed successfully"));
});

/**
 * GET /api/v1/projects/:projectId/members
 */
export const getMembers = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Check requesting user is a member
    const userMembership = await ProjectMember.findOne({
        user: req.user._id,
        project: project._id,
    });

    if (!userMembership) {
        throw new ApiError(403, "You are not a member of this project");
    }

    const members = await ProjectMember.find({ project: project._id })
        .populate("user", "name email")
        .sort({ createdAt: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, members, "Members fetched successfully"));
});
