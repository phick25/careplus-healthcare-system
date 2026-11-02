import { Injectable, Logger } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingPrismaService, BookingRedisService } from './booking.infrastructure';

const RELEASE_OWNED_LOCK_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0
`;

@Injectable()
export class BookingCleanupWorker {
  private readonly logger = new Logger(BookingCleanupWorker.name);

  constructor(
    private readonly prisma: BookingPrismaService,
    private readonly redis: BookingRedisService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredBookings(): Promise<void> {
    const now = new Date();
    const expiredAppointments = await this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.PENDING_PAYMENT,
        holdExpiresAt: { lte: now },
      },
      select: { id: true, redisLockKey: true },
    });

    for (const appointment of expiredAppointments) {
      const result = await this.prisma.appointment.updateMany({
        where: {
          id: appointment.id,
          status: AppointmentStatus.PENDING_PAYMENT,
          holdExpiresAt: { lte: now },
        },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancellationReason: 'Hết hạn thanh toán',
          redisLockKey: null,
          holdExpiresAt: null,
        },
      });

      if (result.count !== 1 || !appointment.redisLockKey) {
        continue;
      }

      try {
        await this.redis.client.eval(
          RELEASE_OWNED_LOCK_SCRIPT,
          1,
          appointment.redisLockKey,
          appointment.id,
        );
      } catch (error: unknown) {
        const detail = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Booking ${appointment.id} expired but its Redis lock could not be released: ${detail}`,
        );
      }
    }
  }
}
