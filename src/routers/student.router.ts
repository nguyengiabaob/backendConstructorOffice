import { Router } from "express";
import studentController from "../controllers/student.controller";

const route = Router();
// route.put("/updateStudent", studentController.updateStudent);

// route.post("/addStudent", studentController.addStudent);

route.get("/getStudents", studentController.getStudents);

// route.get("/getStudents/:phone", studentController.getStudentsById);

// route.delete("/deleteStudent/:phone", studentController.deleteStudent);

export default route;
