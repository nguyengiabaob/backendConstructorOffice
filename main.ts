import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./src/App.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
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
    const config = new DocumentBuilder()
      .setTitle("ConstructorOffice API")
      .setDescription("API documentation for project management")
      .setVersion("1.0")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);

    const port = process.env.PORT ?? 3000;
    app.listen(port, () => {
      console.log("sdsadsa789", process.env.PORT);
      // console.log(`Server is listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
