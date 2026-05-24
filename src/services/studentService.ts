import db from "./database.service";

export interface userData {
  fullName: string;
  phone: string;
  email: string;
}
export interface lessonData {
  title: string;
  description: string;
}
class studentService {
  static addUser = async (data: userData) => {
    // try {
    //   if (!data.fullName || !data.phone || !data.email)
    //     return "The fields are empty";
    //   let exists = await db
    //     .collection("users")
    //     .where("email", "==", data.email)
    //     .get();
    //   if (exists.docs.length) return "The student already exists";
    //   const token = crypto.randomBytes(16).toString("hex");
    //   const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    //   await db.collection("users").add({
    //     ...data,
    //     isActive: false,
    //     role: "student",
    //     setupToken: token,
    //     setupTokenExpires: expiresAt,
    //     createdAt: Date.now(),
    //   });
    //   sendSetupPasswordEmail(data.email, token);
    //   return "The student was added successfully";
    // } catch (error) {
    //   return false;
    // }
  };

  static getStudents = async () => {
    try {
      let students = await db.query("SELECT * FROM students");
      return students;
    } catch (error) {
      return undefined;
    }
  };

  //   static deleteStudent = async (phone: string) => {
  //     try {
  //       if (!phone) return "The fields are empty";

  //       let student = await db
  //         .collection("users")
  //         .where("phone", "==", phone)
  //         .limit(1)
  //         .get();
  //       if (student.docs.length === 0) return "The student does not exist";
  //       await student.docs[0].ref.delete();
  //       return "The student was deleted successfully";
  //     } catch (error) {
  //       return "The student does not exist";
  //     }
  //   };

  //   static updateStudent = async (id: string, data: studentData) => {
  //     try {
  //       if (!id) return "The fields are empty";
  //       await db.collection("users").doc(id).update({
  //         fullName: data.fullName,
  //         phone: data.phone,
  //         email: data.email,
  //       });
  //       return "The student was updated successfully";
  //     } catch (error) {
  //       return false;
  //     }
  //   };
  //   static assignLesson = async (phone: string[], lessons: lessonData) => {
  //     try {
  //       if (!phone) return "The fields are empty";
  //       let listUsers = await db
  //         .collection("users")
  //         .where("phone", "in", phone)
  //         .get();
  //       if (listUsers.docs.length === 0) return "students does not exist";
  //       await db.collection("lessons").add({
  //         studentId: listUsers.docs.map((doc) => doc.id),
  //         lessons: lessons,
  //         assignedAt: new Date(),
  //         assignedBy: "admin",
  //         isCompleted: false,
  //       });
  //       return "The lesson was assigned successfully";
  //     } catch (error) {
  //       return false;
  //     }
  //   };

  //   static getStudentsByPhone = async (phone: string) => {
  //     try {
  //       if (!phone) return "The fields are empty";
  //       let student = await db
  //         .collection("users")
  //         .where("phone", "==", phone)
  //         .get();
  //       return student.docs.map((doc) => doc.data());
  //     } catch (error) {
  //       return undefined;
  //     }
  //   };
}

export default studentService;
