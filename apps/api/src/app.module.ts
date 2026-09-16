import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from 'nestjs-pino';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { OrientationModule } from './orientation/orientation.module';
import { PlacementModule } from './placement/placement.module';
import { RoadmapModule } from './roadmap/roadmap.module';
import { KpiModule } from './kpi/kpi.module';
import { ProjectModule } from './projects/project.module';
import { ProgressModule } from './progress/progress.module';
import { ReportModule } from './reports/report.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EnvironmentVariables, validateEnv } from './common/config/env.validation';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => {
        const nodeEnv = config.get('NODE_ENV', { infer: true });
        const isProduction = nodeEnv === 'production' || Boolean(process.env.VERCEL);
        const isTest = nodeEnv === 'test';

        return {
          pinoHttp: {
            level: isTest ? 'silent' : config.get('LOG_LEVEL', { infer: true }),
            autoLogging: !isTest,
            transport:
              isProduction || isTest
                ? undefined
                : {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      singleLine: true,
                      translateTime: 'SYS:standard',
                    },
                  },
          },
        };
      },
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', { infer: true }) as `${number}m`,
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    AdminModule,
    HealthModule,
    StudentsModule,
    OrientationModule,
    PlacementModule,
    RoadmapModule,
    KpiModule,
    ProjectModule,
    ProgressModule,
    ReportModule,
    DashboardModule,
  ],
})
export class AppModule {}
