import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service';
import { IDENTITY_CONSTANTS } from '../constants/identity.constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthenticatedDeveloper } from '../entities/authenticated-developer.entity';
import { SessionService } from '../services/session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedDeveloper> {
    if (payload.type !== IDENTITY_CONSTANTS.ACCESS_TOKEN_TYPE) {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('Account has been deleted');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Account is inactive');
    }

    try {
      await this.sessionService.assertSessionActive(payload.sessionId);
    } catch {
      throw new UnauthorizedException('Session is no longer active');
    }

    return { ...user, sessionId: payload.sessionId };
  }
}
