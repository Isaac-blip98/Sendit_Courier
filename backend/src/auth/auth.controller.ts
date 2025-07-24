import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as Joi from 'joi';
import { RegisterDto, RegisterSchema } from './dtos/register.dto';
import { LoginDto, LoginSchema } from './dtos/login.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

function validate<T>(schema: Joi.ObjectSchema, payload: T) {
  const { error } = schema.validate(payload);
  if (error) throw new Error(error.message);
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    validate(RegisterSchema, body);
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    validate(LoginSchema, body);
    return this.authService.login(body);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
  }
}
