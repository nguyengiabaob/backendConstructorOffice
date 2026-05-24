import { Module } from "@nestjs/common";
import { authServices } from "../services";
import { PrismaModule } from "./prisma.module";
import { authController } from "../controllers/auth.controller";
import { JwtModule } from "@nestjs/jwt/dist/jwt.module";

@Module({
  controllers: [authController],
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: "bao-it-key",
      signOptions: { expiresIn: "1d" },
    }),
  ],
  providers: [authServices],
})
export class AuthModule {}
