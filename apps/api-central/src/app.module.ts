import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { BookingModule } from './modules/booking/booking.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [BookingModule, PaymentModule, NotificationModule, AuthModule],
})
export class AppModule {}
