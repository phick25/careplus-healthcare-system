import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import type { BookingResponseDTO } from '@packages/shared-types';
import type { CreateBookingDto } from './booking.dto';
import { BookingPrismaService, BookingRedisService } from './booking.infrastructure';

const HOLD_TTL_SECONDS = 600;
const RELEASE_OWNED_LOCK_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0
`;

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: BookingPrismaService,
    private readonly redis: BookingRedisService,
  ) {}

  async holdSlot(dto: CreateBookingDto): Promise<BookingResponseDTO> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
      select: {
        id: true,
        hospitalId: true,
        baseConsultationFee: true,
        currency: true,
        isActive: true,
      },
    });

    if (!doctor || !doctor.isActive) {
      throw new NotFoundException('Bác sĩ không tồn tại hoặc không hoạt động.');
    }

    const slotStartTime = new Date(dto.timeSlot.startTime);
    const slotEndTime = new Date(dto.timeSlot.endTime);
    if (slotStartTime <= new Date() || slotEndTime <= slotStartTime) {
      throw new BadRequestException('Khung giờ khám không hợp lệ hoặc đã qua.');
    }

    const previousBooking = await this.findIdempotentBooking(dto);
    if (previousBooking) {
      return this.toResponse(previousBooking, doctor);
    }

    const redisLockKey = `lock:slot:${dto.doctorId}:${dto.timeSlot.startTime}`;
    const appointmentId = randomUUID();
    const lockResult = await this.redis.client.set(
      redisLockKey,
      appointmentId,
      'EX',
      HOLD_TTL_SECONDS,
      'NX',
    );

    if (lockResult !== 'OK') {
      const concurrentBooking = await this.findIdempotentBooking(dto);
      if (concurrentBooking) {
        return this.toResponse(concurrentBooking, doctor);
      }
      throw new ConflictException('Khung giờ này đang có người giữ hoặc đã được đặt.');
    }

    const holdExpiresAt = new Date(Date.now() + HOLD_TTL_SECONDS * 1000);
    try {
      const appointment = await this.prisma.$transaction(async (transaction) => {
        const patient = await transaction.patient.upsert({
          where: { cccd: dto.nationalId },
          create: {
            cccd: dto.nationalId,
            fullName: dto.fullName,
            phoneNumber: dto.phone,
          },
          update: {
            fullName: dto.fullName,
            phoneNumber: dto.phone,
          },
        });

        return transaction.appointment.create({
          data: {
            id: appointmentId,
            patientId: patient.id,
            doctorId: doctor.id,
            hospitalId: doctor.hospitalId,
            slotStartTime,
            slotEndTime,
            status: AppointmentStatus.PENDING_PAYMENT,
            redisLockKey,
            holdExpiresAt,
            idempotencyKey: dto.idempotencyKey,
            preliminaryReason: dto.preliminaryReason,
          },
        });
      });

      return this.toResponse(appointment, doctor);
    } catch (error: unknown) {
      await this.releaseLock(redisLockKey, appointmentId);

      if (this.isSlotConflict(error)) {
        throw new ConflictException('Khung giờ này đang có người giữ hoặc đã được đặt.');
      }

      throw error;
    }
  }

  private async findIdempotentBooking(dto: CreateBookingDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: { patient: { select: { cccd: true } } },
    });

    if (!appointment) {
      return null;
    }

    const sameRequest =
      appointment.doctorId === dto.doctorId &&
      appointment.patient.cccd === dto.nationalId &&
      appointment.slotStartTime.getTime() === new Date(dto.timeSlot.startTime).getTime() &&
      appointment.slotEndTime.getTime() === new Date(dto.timeSlot.endTime).getTime();

    if (!sameRequest) {
      throw new ConflictException('idempotencyKey đã được sử dụng cho yêu cầu đặt lịch khác.');
    }

    return appointment;
  }

  private toResponse(
    appointment: {
      id: string;
      status: AppointmentStatus;
      slotStartTime: Date;
      slotEndTime: Date;
      holdExpiresAt: Date | null;
    },
    doctor: { baseConsultationFee: Prisma.Decimal; currency: string },
  ): BookingResponseDTO {
    if (!appointment.holdExpiresAt) {
      throw new ConflictException('Cuộc hẹn không có thời điểm hết hạn giữ chỗ.');
    }

    return {
      appointmentId: appointment.id,
      status: appointment.status,
      slot: {
        startTime: appointment.slotStartTime.toISOString(),
        endTime: appointment.slotEndTime.toISOString(),
        price: {
          value: Number(doctor.baseConsultationFee),
          currency: doctor.currency.trim(),
        },
      },
      reservationToken: appointment.id,
      holdExpiresAt: appointment.holdExpiresAt.toISOString(),
    };
  }

  private isSlotConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2002' || error.code === 'P2004')
    );
  }

  private async releaseLock(key: string, appointmentId: string): Promise<void> {
    try {
      await this.redis.client.eval(RELEASE_OWNED_LOCK_SCRIPT, 1, key, appointmentId);
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.error(`Could not release Redis booking lock ${key}: ${detail}`);
    }
  }
}
