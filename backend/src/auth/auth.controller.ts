import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as Joi from 'joi';
import { RegisterDto, RegisterSchema } from './dtos/register.dto';
import { LoginDto, LoginSchema } from './dtos/login.dto';

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
}
