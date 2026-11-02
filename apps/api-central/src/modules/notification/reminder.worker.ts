import { Injectable, Logger } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { Cron } from '@nestjs/schedule';
import { BookingPrismaService } from '../booking/booking.infrastructure';
import { MockNotificationProvider } from './mock-notification.provider';

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ReminderWorker {
  private readonly logger = new Logger(ReminderWorker.name);

  constructor(
    private readonly prisma: BookingPrismaService,
    private readonly notifications: MockNotificationProvider,
  ) {}

  @Cron('0 9 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async sendNextDayReminders(): Promise<void> {
    const nowInVietnam = new Date(Date.now() + VIETNAM_OFFSET_MS);
    const tomorrowMidnightUtc = Date.UTC(
      nowInVietnam.getUTCFullYear(),
      nowInVietnam.getUTCMonth(),
      nowInVietnam.getUTCDate() + 1,
    );
    const start = new Date(tomorrowMidnightUtc - VIETNAM_OFFSET_MS);
    const end = new Date(start.getTime() + DAY_MS);
    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        slotStartTime: { gte: start, lt: end },
      },
      include: {
        patient: { select: { fullName: true, phoneNumber: true } },
        doctor: { select: { fullName: true } },
      },
    });

    for (const appointment of appointments) {
      const phoneNumber = appointment.patient.phoneNumber;
      if (!phoneNumber) {
        this.logger.warn(`Appointment ${appointment.id} has no patient phone; reminder was skipped.`);
        continue;
      }

      const appointmentTime = new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(appointment.slotStartTime);
      await this.notifications.sendSms(
        phoneNumber,
        `Xin chào ${appointment.patient.fullName}, bạn có lịch khám với bác sĩ ${appointment.doctor.fullName} vào ${appointmentTime} ngày mai. Vui lòng có mặt trước giờ khám 15 phút. Mã cuộc hẹn: ${appointment.id}.`,
      );
    }
  }
}
