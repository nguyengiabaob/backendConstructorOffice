import { Router } from "express";
import studentController from "../controllers/student.controller";

const route = Router();

route.post("/addStudent", studentController.addStudent);

route.post("/students", studentController.assignLesson);

route.put("/update", studentController.updateStudent);
route.delete("/delete:phone", studentController.deleteStudent);

route.get("/getAll", studentController.getStudents);
route.get("/get/:phone", studentController.getStudentsById);

route.get("/editProfile", studentController.editStudent);

export default route;
