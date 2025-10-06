import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module } from '@nestjs/common';

import appConfig from '@/configs/app.config';
import authConfig from '@/configs/auth.config';
import { AuthModule } from '@/auth/auth.module';
import minioConfig from '@/configs/minio.config';
import redisConfig from '@/configs/redis.config';
import { UsersModule } from '@/users/users.module';
import { MinioModule } from '@/minio/minio.module';
import { LoggerModule } from '@/logger/logger.module';
import sequelizeConfig from '@/configs/sequelize.config';
import { SessionsModule } from '@/sessions/sessions.module';
import pinoLoggerConfig from '@/configs/pino-logger.config';
import { DatabasesModule } from '@/database/databases.module';
import { CustomThrottlerGuard } from '@/common/throtler.guard';
import { PortfoliosModule } from '@/portfolios/portfolios.module';
import { CacheConfigService } from '@/configs/cache-config.service';
import { AuthMiddleware } from '@/common/middlewares/auth.middleware';
import { ThrottlerModule } from '@nestjs/throttler';
import { RateLimitConfigService } from '@/configs/rate-limit-config.service';
import { MediaModule } from '@/media/media.module';
import { BullQueueModule } from '@/bull/bull-queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        sequelizeConfig,
        authConfig,
        minioConfig,
        redisConfig,
        pinoLoggerConfig,
      ],
    }),
    CacheModule.registerAsync({
      useClass: CacheConfigService,
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      useClass: RateLimitConfigService,
    }),
    LoggerModule,
    DatabasesModule,
    UsersModule,
    AuthModule,
    SessionsModule,
    PortfoliosModule,
    MinioModule,
    MediaModule,
    BullQueueModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard, // global rate limit
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('');
  }
}
