import mongoose,{Schema} from "mongoose";
import { AvailableTaskStatus, TaskStatusEnum } from "../constants";
import { Project } from "./project.model";
import { User } from "./user.model";

const taskSchema = new Schema({
    title:{
        type: String,
        required: true,
        trim: true
    },
    description: String,
    status:{
        type: String,
        enum: AvailableTaskStatus,
        default: TaskStatusEnum.TODO
    },
    dueDate:{
        type: Date,
        default: null
    },
    project:{
        type: Schema.Types.ObjectId,
        ref: Project
    },
    assignedTo:{
        type: Schema.Types.ObjectId,
        ref: User
    },
    assignedBy:{
        type: Schema.Types.ObjectId,
        ref: User
    }

},{timestamps:true})

export const Task = mongoose.model("Task",taskSchema)