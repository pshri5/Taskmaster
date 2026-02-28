import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
});

import { connectDB } from "./db/index.js";
import app from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";

const port = process.env.PORT || 3000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    },
});

// Make io accessible to controllers via app
app.set("io", io);

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Allow users to join their personal notification room
    socket.on("join", (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their notification room`);
    });

    socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

connectDB()
    .then(() => {
        httpServer.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.log("MongoDB connection error", err);
    });