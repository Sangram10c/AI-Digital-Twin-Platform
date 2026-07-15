import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * JWT infrastructure module.
 * Registers JwtModule for future auth implementation — no routes or strategies.
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.getOrThrow<string>('jwt.secret');
        const expiresIn = configService.getOrThrow<string>(
          'jwt.accessExpiration',
        );

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
          },
        };
      },
    }),
  ],
  exports: [JwtModule],
})
export class JwtConfigModule {}
