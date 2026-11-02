import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppointmentEventBus } from './appointment-event-bus';
import { BookingCleanupWorker } from './booking-cleanup.worker';
import { BookingController } from './booking.controller';
import { BookingPrismaService, BookingRedisService } from './booking.infrastructure';
import { BookingService } from './booking.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [BookingController],
  providers: [
    BookingPrismaService,
    BookingRedisService,
    AppointmentEventBus,
    BookingService,
    BookingCleanupWorker,
  ],
  exports: [AppointmentEventBus, BookingPrismaService, BookingRedisService, BookingService],
})
export class BookingModule {}
