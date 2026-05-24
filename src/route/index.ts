import { Router } from "express";
import StudentRoute from "./student.route";

const route = Router();

route.use("/student", StudentRoute);

export default route;
