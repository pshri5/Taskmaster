import { Router } from "express";
import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
    getMembers,
} from "../controllers/project.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All project routes are protected
router.use(verifyJWT);

router.route("/").post(createProject).get(getProjects);

router
    .route("/:projectId")
    .get(getProjectById)
    .patch(updateProject)
    .delete(deleteProject);

// Member management
router
    .route("/:projectId/members")
    .post(addMember)
    .get(getMembers);

router.delete("/:projectId/members/:userId", removeMember);

export default router;
