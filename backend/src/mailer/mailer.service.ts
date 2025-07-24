import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly mailerService: NestMailerService) {}

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Welcome to SendIT!',
        template: 'welcome',
        context: { name },
      });
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}:`, error);
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }
  }

  async sendPasswordResetCode(to: string, code: string, name: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: 'SendIT Password Reset Code',
        template: 'reset-password',
        context: { name, code },
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}:`, error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  async sendCourierAssignmentEmail(to: string, courierName: string, parcelId: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Courier Assigned to Your Parcel',
        template: 'courier-assigned',
        context: {
          courierName,
          parcelId,
        },
      });
      this.logger.log(`Courier assignment email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send courier assignment email to ${to}:`, error);
      throw new Error(`Failed to send courier assignment email: ${error.message}`);
    }
  }

  async testEmailConnection(): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: 'test@example.com',
        subject: 'SendIT Email Test',
        text: 'This is a test email from SendIT to verify email configuration.',
      });
      this.logger.log('Test email sent successfully');
      return true;
    } catch (error) {
      this.logger.error('Email configuration test failed:', error);
      return false;
    }
  }
}
