import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  APPOINTMENT_CONFIRMED_EVENT,
  AppointmentEventBus,
} from '../booking/appointment-event-bus';
import { BookingPrismaService } from '../booking/booking.infrastructure';
import { MockNotificationProvider } from './mock-notification.provider';

@Injectable()
export class AppointmentConfirmedListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppointmentConfirmedListener.name);
  private unsubscribe?: () => void;

  constructor(
    private readonly events: AppointmentEventBus,
    private readonly prisma: BookingPrismaService,
    private readonly notifications: MockNotificationProvider,
  ) {}

  onModuleInit(): void {
    this.unsubscribe = this.events.subscribe(
      APPOINTMENT_CONFIRMED_EVENT,
      ({ appointmentId }) => this.sendConfirmation(appointmentId),
    );
  }

  onModuleDestroy(): void {
    this.unsubscribe?.();
  }

  private async sendConfirmation(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { fullName: true, phoneNumber: true, email: true } },
        doctor: { select: { fullName: true } },
      },
    });

    if (!appointment) {
      this.logger.error(`Confirmed appointment ${appointmentId} could not be loaded.`);
      return;
    }

    const appointmentTime = new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(appointment.slotStartTime);
    const checkInCode = `CHECKIN-${appointment.id}`;
    const message = [
      `Xin chào ${appointment.patient.fullName},`,
      `Lịch khám của bạn với bác sĩ ${appointment.doctor.fullName} đã được xác nhận.`,
      `Giờ khám: ${appointmentTime}.`,
      `Mã cuộc hẹn: ${appointment.id}.`,
      `Mã QR Check-in: ${checkInCode}.`,
      'Vui lòng có mặt trước giờ khám 15 phút.',
    ].join('\n');

    if (appointment.patient.email) {
      await this.notifications.sendEmail(
        appointment.patient.email,
        `Xác nhận lịch khám ${appointment.id}`,
        message,
      );
    } else {
      this.logger.warn(`Appointment ${appointment.id} has no patient email; email was skipped.`);
    }

    if (appointment.patient.phoneNumber) {
      await this.notifications.sendSms(appointment.patient.phoneNumber, message);
    } else {
      this.logger.warn(`Appointment ${appointment.id} has no patient phone; SMS was skipped.`);
    }
  }
}
