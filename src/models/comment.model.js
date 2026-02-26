import mongoose, { Schema } from "mongoose";
import { Task } from "./task.model";
import { User } from "./user.model";

const commentSchema = new Schema({
    task:{
        type: Schema.Types.ObjectId,
        ref: Task,
        required: true
    },
    user:{
        type: Schema.Types.ObjectId,
        ref: User,
        required: true
    },
    content:{
        type: String,
        required: [true,"Comment content is required"],

    }
},{timestamps:true})


export const Comment = mongoose.model("Comment",commentSchema)