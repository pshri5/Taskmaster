import express from "express"
import cors from"cors"

const app = express()
app.use(express.urlencoded({limit:"20kb", extended: true}))
app.use(express.json({limit: "20kb"}))

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


export default app