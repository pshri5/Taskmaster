import mongoose,{Schema} from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"

const userSchema = new Schema({
    name:{
        type: String,
        required: [true,"Name is required"],
        trim: true
    },
    email:{
        type: String,
        required: [true, "email is required"],
        unique: true,
        trim: true
    },
    password:{
        type: String,
        required:[true,"Password is required"],
        minlength: 6,
        select: false
    },
    isEmailVerified:{
        type: Boolean,
        default: false
    },
    refreshToken:{
        type: String
    },
    forgetPasswordToken:{
        type: String
    },
    forgetPasswordExpiry:{
        type: Date
    },
    emailVerificationToken:{
        type: String
    },
    emailVerificationExpiry:{
        type: Date
    },

},{timestamps:true});






export const User = mongoose.model("User",userSchema)