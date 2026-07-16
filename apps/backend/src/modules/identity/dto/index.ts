import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsStrongPassword } from '../validators/is-strong-password.validator';

export class RegisterDeveloperDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ example: 'Str0ng!Pass' })
  @IsString()
  @IsStrongPassword()
  password!: string;

  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  displayName?: string;
}

export class LoginDeveloperDto {
  @ApiProperty({ example: 'chougulesangram3@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Sangram@2770' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Opaque refresh token issued at login/register' })
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token from email' })
  @IsString()
  @MinLength(20)
  token!: string;

  @ApiProperty({ example: 'NewStr0ng!Pass' })
  @IsString()
  @IsStrongPassword()
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'Str0ng!Pass' })
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @ApiProperty({ example: 'NewStr0ng!Pass' })
  @IsString()
  @IsStrongPassword()
  newPassword!: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    description:
      'Email verification token — use devToken from register or resend-verification (development only)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @MinLength(20)
  token!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email!: string;
}

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'Refresh token to revoke for this device/session',
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  refreshToken?: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message!: string;

  @ApiPropertyOptional({
    description:
      'Development only — full token for Swagger/local testing. Omitted in production.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  devToken?: string;
}

class AuthTokensResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ example: '15m' })
  expiresIn!: string;
}

class AuthenticatedUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional()
  firstName!: string | null;

  @ApiPropertyOptional()
  lastName!: string | null;

  @ApiPropertyOptional()
  displayName!: string | null;

  @ApiProperty({ example: 'USER' })
  role!: string;

  @ApiProperty({ example: 'PENDING_VERIFICATION' })
  status!: string;

  @ApiPropertyOptional()
  emailVerifiedAt!: Date | null;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthenticatedUserResponseDto })
  user!: AuthenticatedUserResponseDto;

  @ApiProperty({ type: AuthTokensResponseDto })
  tokens!: AuthTokensResponseDto;

  @ApiPropertyOptional({
    description:
      'Development only — email verification token for POST /auth/verify-email. Omitted in production.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  devToken?: string;
}
