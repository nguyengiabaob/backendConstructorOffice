import { db } from "../app";

class LessonService {
  static getMyLessons = async (phone: string) => {
    if (phone === undefined) return undefined;
    try {
      const result = await db
        .collection("lessons")
        .where("phone", "==", phone)
        .get();
      if (result) return result;
    } catch (error) {
      return undefined;
    }
  };
  static markLessonDone = async (phone: string, lessonId: string) => {
    if (phone === undefined || lessonId === undefined) return undefined;

    let lesson = await db.collection("lessons").doc(lessonId).get();
    if (lesson.data()?.isCompleted === true) return undefined;

    try {
      const result = await db
        .collection("lessons")
        .doc(lessonId)
        .update({ isCompleted: true });
      if (result) return result;
    } catch (error) {
      return undefined;
    }
  };
}
