# Taskmaster

A collaborative task tracking and management REST API built with Node.js, Express, and MongoDB. It supports user authentication, project and task management, comments, file attachments, and real-time notifications via Socket.IO.

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 5
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (access + refresh tokens), bcryptjs
- **Real-time:** Socket.IO
- **File Uploads:** Multer (up to 5 files per request)

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB instance 

### Installation

```bash
git clone https://github.com/pshri5/Taskmaster.git
cd Taskmaster
npm install
```

### Configuration

Copy the sample env file and fill in your values:

```bash
cp .env.sample .env
```

| Variable               | Description                        |
| ---------------------- | ---------------------------------- |
| `PORT`                 | Server port                        |
| `MONGO_URI`            | MongoDB connection string          |
| `CORS_ORIGIN`          | Allowed origin for CORS            |
| `ACCESS_TOKEN_SECRET`  | Secret for signing access tokens   |
| `ACCESS_TOKEN_EXPIRY`  | Access token lifetime (e.g. `15m`) |
| `REFRESH_TOKEN_SECRET` | Secret for signing refresh tokens  |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifetime (e.g. `7d`) |

### Running

```bash
npm run dev
```

The server starts at `http://localhost:<PORT>` and a health check is available at `GET /api/v1/health`.

## Project Structure

```
src/
  index.js            # Entry point, HTTP server, Socket.IO setup
  app.js              # Express app, middleware, route mounting
  constants.js        # Enums (task status, user roles, notification types)
  db/                 # MongoDB connection
  models/             # Mongoose schemas (User, Project, Task, Comment, etc.)
  controllers/        # Route handlers
  routes/             # Express routers
  middlewares/         # Auth (JWT verification) and file upload (Multer)
  utils/              # ApiError, ApiResponse, asyncHandler
```

## API Reference

All endpoints are prefixed with `/api/v1`. Protected routes require a Bearer token in the `Authorization` header.

### Auth `/auth`

| Method  | Endpoint         | Auth | Description             |
| ------- | ---------------- | ---- | ----------------------- |
| `POST`  | `/register`      | No   | Create a new account    |
| `POST`  | `/login`         | No   | Log in, receive tokens  |
| `POST`  | `/refresh-token` | No   | Refresh an access token |
| `POST`  | `/logout`        | Yes  | Log out                 |
| `GET`   | `/me`            | Yes  | Get current user        |
| `PATCH` | `/profile`       | Yes  | Update profile          |

### Tasks `/tasks`

| Method  | Endpoint           | Description                  |
| ------- | ------------------ | ---------------------------- |
| `POST`  | `/`                | Create a task                |
| `GET`   | `/`                | List tasks                   |
| `GET`   | `/:taskId`         | Get a task by ID             |
| `PATCH` | `/:taskId`         | Update a task                |
| `DELETE`| `/:taskId`         | Delete a task                |
| `PATCH` | `/:taskId/status`  | Update task status           |

Task statuses: `todo`, `in-progress`, `completed`.

### Projects `/projects`

| Method   | Endpoint                      | Description        |
| -------- | ----------------------------- | ------------------ |
| `POST`   | `/`                           | Create a project   |
| `GET`    | `/`                           | List projects      |
| `GET`    | `/:projectId`                 | Get project by ID  |
| `PATCH`  | `/:projectId`                 | Update a project   |
| `DELETE` | `/:projectId`                 | Delete a project   |
| `POST`   | `/:projectId/members`         | Add a member       |
| `GET`    | `/:projectId/members`         | List members       |
| `DELETE` | `/:projectId/members/:userId` | Remove a member    |

User roles: `super-admin`, `project-admin`, `member`.

### Comments

| Method   | Endpoint                       | Description         |
| -------- | ------------------------------ | ------------------- |
| `POST`   | `/tasks/:taskId/comments`      | Add a comment       |
| `GET`    | `/tasks/:taskId/comments`      | List task comments  |
| `PATCH`  | `/comments/:commentId`         | Update a comment    |
| `DELETE` | `/comments/:commentId`         | Delete a comment    |

### Attachments

| Method   | Endpoint                            | Description               |
| -------- | ----------------------------------- | ------------------------- |
| `POST`   | `/tasks/:taskId/attachments`        | Upload files (max 5)      |
| `GET`    | `/tasks/:taskId/attachments`        | List task attachments     |
| `GET`    | `/attachments/:attachmentId/download` | Download a file         |
| `DELETE` | `/attachments/:attachmentId`        | Delete an attachment      |

### Notifications `/notifications`

| Method  | Endpoint                    | Description              |
| ------- | --------------------------- | ------------------------ |
| `GET`   | `/`                         | List notifications       |
| `PATCH` | `/read-all`                 | Mark all as read         |
| `PATCH` | `/:notificationId/read`     | Mark one as read         |

Notification types: `task_assigned`, `task_updated`, `comment_added`, `project_invitation`, `member_removed`.

## Real-time Events

The server exposes a Socket.IO endpoint at the root. Clients can join a personal notification room by emitting a `join` event with their user ID to receive notifications in real time.

