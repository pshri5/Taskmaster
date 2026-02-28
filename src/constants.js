export const TaskStatusEnum = {
    TODO: "todo",
    IN_PROGRESS: "in-progress",
    COMPLETED: "completed"
}

export const AvailableTaskStatus = Object.values(TaskStatusEnum)

export const UserRoleEnum = {
    SUPER_ADMIN: "super-admin",
    PROJECT_ADMIN: "project-admin",
    MEMBER: "member"
}

export const AvailableUserRole = Object.values(UserRoleEnum)

export const NotificationTypeEnum = {
    TASK_ASSIGNED: "task_assigned",
    TASK_UPDATED: "task_updated",
    COMMENT_ADDED: "comment_added",
    PROJECT_INVITATION: "project_invitation",
    MEMBER_REMOVED: "member_removed",
};

export const AvailableNotificationTypes = Object.values(NotificationTypeEnum);