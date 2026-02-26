import dotenv from "dotenv"
import { connectDB } from "./db"
import app from "./app"


const port = process.env.PORT

dotenv.config({
    path: "./.env"
})

connectDB()
.then(()=>{
    app.listen(prompt,()=>{
        console.log(`Server is running on port ${port} `)
    })
})
.catch((err)=>{
    console.log("Mongodb connection error",err)
})