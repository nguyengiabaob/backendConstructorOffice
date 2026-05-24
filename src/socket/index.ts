import { Server, Socket } from "socket.io";
import { db } from "../firebase";
export interface ChatMessage {
  roomId: string;
  userId: string;
  username: string;
  content: string;
  createdAt?: FirebaseFirestore.Timestamp;
}
export const socketService = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("send_message", async (message: ChatMessage) => {
      try {
        const data: ChatMessage = {
          ...message,
          //createdAt: FieldValue.serverTimestamp(),
        };

        await db
          .collection("rooms")
          .doc(message.roomId)
          .collection("messages")
          .add(data);

        io.to(message.roomId).emit("new_message", data);
      } catch (err) {
        console.error("Save message error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
