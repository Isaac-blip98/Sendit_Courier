import { Body, Controller, Post } from '@nestjs/common';
import { MailerService } from './mailer.service';

@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @Post('welcome')
  async sendWelcome(@Body() body: { email: string; name: string }) {
    return this.mailerService.sendWelcomeEmail(body.email, body.name);
  }

  @Post('reset-password')
  async sendResetPassword(@Body() body: { email: string; code: string; name: string }) {
    return this.mailerService.sendPasswordResetCode(body.email, body.code, body.name);
  }

  @Post('courier-assigned')
  async sendCourierAssignment(@Body() body: { email: string; courierName: string; parcelId: string }) {
    return this.mailerService.sendCourierAssignmentEmail(body.email, body.courierName, body.parcelId);
  }

  @Post('test')
  async testConnection() {
    const result = await this.mailerService.testEmailConnection();
    return { status: result ? 'OK' : 'FAIL' };
  }
}
