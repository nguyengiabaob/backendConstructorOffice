import { Request, Response } from "express";
import studentService from "../services/studentService";
import { getDecode } from "../utils/jwtAuth";
class studentController {
  // static addStudent = async (req: Request, res: Response) => {
  //   try {
  //     const { data } = req.body as { data: studentData };

  //     const result = await studentService.addStudent(data);

  //     return res.status(200).json(result);
  //   } catch (error) {
  //     return res.status(500).json(error);
  //   }
  // };
  static getStudents = async (req: Request, res: Response) => {
    try {
      const result = await studentService.getStudents();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json(error);
    }
  };

  // static getStudentsById = async (req: Request, res: Response) => {
  //   try {
  //     const { phone } = req.params as { phone: string };
  //     const result = await studentService.getStudentsByPhone(phone);
  //     if (!result) {
  //       return res.status(404).json("The student does not exist");
  //     }
  //     return res.status(200).json(result);
  //   } catch (error) {
  //     return res.status(500).json(error);
  //   }
  // };

  // static deleteStudent = async (req: Request, res: Response) => {
  //   try {
  //     const { phone } = req.params as { phone: string };
  //     const result = await studentService.deleteStudent(phone);
  //     return res.status(200).json(result);
  //   } catch (error) {
  //     return res.status(500).json(error);
  //   }
  // };
  // static assignLesson = async (req: Request, res: Response) => {
  //   try {
  //     const { data, phone } = req.body as { data: lessonData; phone: string[] };
  //     const result = await studentService.assignLesson(phone, data);
  //     return res.status(200).json(result);
  //   } catch (error) {
  //     return res.status(500).json(error);
  //   }
  // };
  // static updateStudent = async (req: Request, res: Response) => {
  //   try {
  //     const { data, id } = req.body as { data: studentData; id: string };
  //     const result = await studentService.updateStudent(id, data);
  //     return res.status(200).json(result);
  //   } catch (error) {
  //     return res.status(500).json(error);
  //   }
  // };

  // static editStudent = async (req: Request, res: Response) => {
  //   let userLogin = getDecode(req);
  //   let id = userLogin?.id;
  //   if (id) {
  //     try {
  //       const { data } = req.body as { data: studentData };
  //       const result = await studentService.updateStudent(id, data);
  //       return res.status(200).json(result);
  //     } catch (error) {
  //       return res.status(500).json(error);
  //     }
  //   }
  //   return res.status(500).json({ message: "Error" });
  // };
}
export default studentController;
