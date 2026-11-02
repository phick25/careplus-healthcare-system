import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MockNotificationProvider {
  private readonly logger = new Logger(MockNotificationProvider.name);

  async sendEmail(recipient: string, subject: string, message: string): Promise<void> {
    void recipient;
    void subject;
    void message;
    this.logger.log('Mock email delivered.');
  }

  async sendSms(recipient: string, message: string): Promise<void> {
    void recipient;
    void message;
    this.logger.log('Mock SMS delivered.');
  }
}
