import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentDeveloper } from './decorators/current-developer.decorator';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDeveloperDto,
  LogoutDto,
  MessageResponseDto,
  RefreshTokenDto,
  RegisterDeveloperDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
  AuthResponseDto,
} from './dto';
import type { AuthenticatedDeveloper } from './entities/authenticated-developer.entity';
import { AuthResponse } from './interfaces/auth-response.interface';
import { IdentityService } from './identity.service';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: 201,
    description:
      'User registered. In development, response includes devToken for POST /auth/verify-email.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDeveloperDto,
    @Req() req: Request,
  ): Promise<AuthResponse> {
    return this.identityService.register(dto, this.getRequestContext(req));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDeveloperDto,
    @Req() req: Request,
  ): Promise<AuthResponse> {
    return this.identityService.login(dto, this.getRequestContext(req));
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke the current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @CurrentDeveloper() developer: AuthenticatedDeveloper,
    @Body() dto: LogoutDto,
  ): Promise<MessageResponseDto> {
    await this.identityService.logout(
      developer,
      developer.sessionId,
      dto.refreshToken,
    );
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate refresh token and issue a new access token',
  })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<AuthResponse['tokens']> {
    return this.identityService.refresh(
      dto.refreshToken,
      this.getRequestContext(req),
    );
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({
    status: 200,
    description:
      'Reset email queued if account exists. In development, response includes devToken for Swagger testing.',
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    return this.identityService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a reset token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<MessageResponseDto> {
    return this.identityService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  async changePassword(
    @CurrentDeveloper() developer: AuthenticatedDeveloper,
    @Body() dto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    return this.identityService.changePassword(
      developer,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification message' })
  @ApiResponse({
    status: 200,
    description:
      'Verification email queued if applicable. In development, response includes devToken for POST /auth/verify-email.',
    type: MessageResponseDto,
  })
  async resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<MessageResponseDto> {
    return this.identityService.resendVerification(dto.email);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address using a verification token' })
  @ApiResponse({
    status: 200,
    description: 'Email verified',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<MessageResponseDto> {
    return this.identityService.verifyEmail(dto.token);
  }

  private getRequestContext(req: Request) {
    return {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
  }
}
