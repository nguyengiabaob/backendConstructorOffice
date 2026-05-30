import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./App.module";

const startServer = async () => {
  try {
    console.log("APP STARTING...");
    const app = await NestFactory.create(AppModule);
    // Start the server
    app.setGlobalPrefix("api");

    app.enableCors({
      origin: "*", // hoặc http://localhost:5173
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      credentials: true,
    });

    const port = 3000;
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
