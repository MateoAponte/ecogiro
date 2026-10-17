import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from '../config/joi.validation';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RecoveryModule } from './collections/recovery.module';
import { RewardModule } from './rewards/reward.module';
import { MedailModule } from './medails/medail.module';
import { ScanModule } from './scan/scan.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.local',
        `.env.${process.env.NODE_ENV ?? 'dev'}`,
        '.env.dev',
      ],
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',

        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),

        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),

        autoLoadEntities: true,
        synchronize: true,

        logging: configService.get<string>('NODE_ENV') === 'dev',
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    RecoveryModule,
    RewardModule,
    MedailModule,
    ScanModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
