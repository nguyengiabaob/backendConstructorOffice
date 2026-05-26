import { Router } from "express";
import studentController from "../controllers/student.controller";

const route = Router();

route.get("/getAll", studentController.getStudents);

export default route;
