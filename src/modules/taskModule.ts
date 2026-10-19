import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { TASK_SERVICE } from "../TokenServices/Project.Token";
import { TaskService } from "../services/Task/Task.Service";
import { TaskController } from "../controllers/TaskController";

@Module({
  controllers: [TaskController],
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: "bao-it-key",
      signOptions: { expiresIn: "1d" },
    }),
  ],
  providers: [
    {
      provide: TASK_SERVICE,
      useClass: TaskService,
    },
  ],
})
export class TaskModule {}
