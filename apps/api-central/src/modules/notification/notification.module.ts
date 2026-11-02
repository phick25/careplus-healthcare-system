import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { AppointmentConfirmedListener } from './appointment-confirmed.listener';
import { MockNotificationProvider } from './mock-notification.provider';
import { ReminderWorker } from './reminder.worker';

@Module({
  imports: [BookingModule],
  providers: [
    MockNotificationProvider,
    AppointmentConfirmedListener,
    ReminderWorker,
  ],
  exports: [MockNotificationProvider],
})
export class NotificationModule {}
