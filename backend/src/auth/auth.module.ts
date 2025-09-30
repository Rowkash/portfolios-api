import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersModule } from '@/users/users.module';
import { AuthService } from '@/auth/services/auth.service';
import { AuthController } from '@/auth/controllers/auth.controller';
import { SessionsModule } from '@/sessions/sessions.module';

@Module({
  imports: [UsersModule, SessionsModule],
  providers: [AuthService, JwtService],
  controllers: [AuthController],
  exports: [JwtService],
})
export class AuthModule {}
