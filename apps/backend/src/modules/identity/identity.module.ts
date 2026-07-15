import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtConfigModule } from '../../common/modules/jwt-config.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { emailServiceProvider } from './services/noop-email.service';
import { PasswordService } from './services/password.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtConfigModule,
  ],
  controllers: [IdentityController],
  providers: [
    IdentityService,
    PasswordService,
    SessionService,
    RefreshTokenService,
    TokenService,
    JwtStrategy,
    JwtAuthGuard,
    emailServiceProvider,
    {
      provide: APP_GUARD,
      useExisting: JwtAuthGuard,
    },
  ],
  exports: [IdentityService, PasswordService, JwtAuthGuard],
})
export class IdentityModule {}
