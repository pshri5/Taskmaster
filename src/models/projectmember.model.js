import mongoose,{Schema} from "mongoose";
import { User } from "./user.model";
import { Project } from "./project.model";
import { AvailableUserRole, UserRoleEnum } from "../constants";

const projectMemberSchema = new Schema({
    memberName:{
        type:Schema.Types.ObjectId,
        ref: User
    },
    project:{
        type: Schema.Types.ObjectId,
        ref: Project
    },
    role:{
        type: String,
        enum: AvailableUserRole,
        default: UserRoleEnum.MEMBER
    }
},{timestamps:true})

export const ProjectMember = mongoose.model("ProjectMember",projectMemberSchema)
