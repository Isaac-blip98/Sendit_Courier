import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { MailerService } from 'src/mailer/mailer.service';
import { randomInt } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new Error('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashed,
        role: 'CUSTOMER',
      },
    });

    await this.mailerService.sendWelcomeEmail(user.email, user.name);
    return this.signToken(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, user.email, user.role);
  }

  private signToken(id: string, email: string, role: string) {
    const payload = { sub: id, email, role };
    return {
      access_token: this.jwt.sign(payload),
      role,
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('No user with that email');

    const code = randomInt(100000, 999999).toString(); // 6-digit
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

    await this.prisma.user.update({
      where: { email },
      data: {
        resetCode: code,
        resetCodeExpires: expires,
      },
    });

    await this.mailerService.sendPasswordResetCode(email, code, user.name);
    return { message: 'Reset code sent' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.resetCode !== code) {
      throw new BadRequestException('Invalid code or email');
    }

    if (!user.resetCodeExpires || new Date() > user.resetCodeExpires) {
      throw new BadRequestException('Reset code expired');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { email },
      data: {
        password: hashed,
        resetCode: null,
        resetCodeExpires: null,
      },
    });

    return { message: 'Password reset successful' };
  }
}
