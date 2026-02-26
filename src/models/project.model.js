import mongoose,{Schema} from "mongoose";
import { User } from "./user.model";

const projectSchema = new Schema({
    name:{
        type: String,
        required: [true,"Name is required"],

    },
    description: String,
    createdBy:{
        type: Schema.Types.ObjectId,
        ref: User,
        required: true
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: User
    }]
},{timestamps:true})

export const Project = mongoose.model("Project",projectSchema)
