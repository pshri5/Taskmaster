export const TaskStatusEnum = {
    TODO : "todo",
    IN_PROGRESS :"in-progress",
    COMPLETED: "completed"
}

export const AvailableTaskStatus = Object.values(TaskStatusEnum)

export const UserRoleEnum = {
    SUPER_ADMIN: "super-admin",
    PROJECT_ADMIN: "project-admin",
    MEMBER: "member"
}

export const  AvailableUserRole = Object.values(UserRoleEnum)