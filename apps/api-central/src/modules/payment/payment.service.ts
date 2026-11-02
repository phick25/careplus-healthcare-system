import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import type {
  PaymentCallbackResponseDTO,
  PaymentUrlResponseDTO,
} from '@packages/shared-types';
import {
  APPOINTMENT_CONFIRMED_EVENT,
  AppointmentEventBus,
} from '../booking/appointment-event-bus';
import { BookingPrismaService, BookingRedisService } from '../booking/booking.infrastructure';
import type { PaymentCallbackDto } from './payment.dto';

const RELEASE_OWNED_LOCK_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0
`;

type PaymentParameters = Record<string, string | undefined>;
const DEFAULT_MERCHANT_CODE = 'MOCKVN01';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: BookingPrismaService,
    private readonly redis: BookingRedisService,
    private readonly events: AppointmentEventBus,
  ) {}

  async createPaymentUrl(appointmentId: string): Promise<PaymentUrlResponseDTO> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: { select: { baseConsultationFee: true, currency: true } } },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy cuộc hẹn.');
    }
    if (
      appointment.status !== AppointmentStatus.PENDING_PAYMENT ||
      !appointment.holdExpiresAt ||
      appointment.holdExpiresAt <= new Date()
    ) {
      throw new ConflictException('Cuộc hẹn không còn trong thời hạn thanh toán.');
    }
    if (appointment.doctor.currency.trim().toUpperCase() !== 'VND') {
      throw new InternalServerErrorException('Cổng thanh toán hiện chỉ hỗ trợ đơn vị tiền tệ VND.');
    }

    const now = new Date();
    const parameters: PaymentParameters = {
      vnp_Amount: String(this.toMinorUnits(Number(appointment.doctor.baseConsultationFee))),
      vnp_Command: 'pay',
      vnp_CreateDate: this.formatVnpDate(now),
      vnp_CurrCode: 'VND',
      vnp_IpAddr: '127.0.0.1',
      vnp_Locale: 'vn',
      vnp_OrderInfo: `Thanh toan tam ung lich kham ${appointment.id}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: process.env.PAYMENT_RETURN_URL ?? 'http://localhost:3000/booking/payment-result',
      vnp_TmnCode: process.env.PAYMENT_TMN_CODE || DEFAULT_MERCHANT_CODE,
      vnp_TxnRef: appointment.id,
      vnp_Version: '2.1.0',
    };
    const signature = this.sign(parameters);
    const paymentUrl = new URL(
      process.env.PAYMENT_GATEWAY_URL ?? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    );
    for (const [key, value] of Object.entries(parameters)) {
      if (value !== undefined) {
        paymentUrl.searchParams.set(key, value);
      }
    }
    paymentUrl.searchParams.set('vnp_SecureHash', signature);

    return {
      appointmentId: appointment.id,
      paymentUrl: paymentUrl.toString(),
      expiresAt: appointment.holdExpiresAt.toISOString(),
    };
  }

  async handlePaymentCallback(
    paymentResponseDto: PaymentCallbackDto,
  ): Promise<PaymentCallbackResponseDTO> {
    const { vnp_SecureHash: signature, vnp_SecureHashType: _hashType, ...parameters } =
      paymentResponseDto;
    if (!this.isValidSignature(parameters, signature)) {
      throw new ConflictException('Chữ ký callback thanh toán không hợp lệ.');
    }
    if (paymentResponseDto.vnp_TmnCode !== (process.env.PAYMENT_TMN_CODE || DEFAULT_MERCHANT_CODE)) {
      throw new ConflictException('Mã đơn vị thanh toán không hợp lệ.');
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: paymentResponseDto.vnp_TxnRef },
      include: { doctor: { select: { baseConsultationFee: true, currency: true } } },
    });
    if (!appointment) {
      throw new NotFoundException('Không tìm thấy cuộc hẹn của giao dịch.');
    }

    if (appointment.doctor.currency.trim().toUpperCase() !== 'VND') {
      throw new InternalServerErrorException('Cổng thanh toán hiện chỉ hỗ trợ đơn vị tiền tệ VND.');
    }
    const expectedAmount = this.toMinorUnits(Number(appointment.doctor.baseConsultationFee));
    if (Number(paymentResponseDto.vnp_Amount) !== expectedAmount) {
      throw new ConflictException('Số tiền thanh toán không khớp với cuộc hẹn.');
    }

    const successful =
      paymentResponseDto.vnp_ResponseCode === '00' &&
      paymentResponseDto.vnp_TransactionStatus === '00';
    if (!successful) {
      return { appointmentId: appointment.id, status: 'DECLINED' };
    }

    if (appointment.status === AppointmentStatus.CONFIRMED) {
      return { appointmentId: appointment.id, status: 'CONFIRMED' };
    }
    if (
      appointment.status !== AppointmentStatus.PENDING_PAYMENT ||
      !appointment.holdExpiresAt ||
      appointment.holdExpiresAt <= new Date()
    ) {
      throw new ConflictException('Cuộc hẹn không còn hợp lệ để xác nhận thanh toán.');
    }

    const result = await this.prisma.appointment.updateMany({
      where: {
        id: appointment.id,
        status: AppointmentStatus.PENDING_PAYMENT,
        holdExpiresAt: { gt: new Date() },
      },
      data: {
        status: AppointmentStatus.CONFIRMED,
        holdExpiresAt: null,
        redisLockKey: null,
      },
    });

    if (result.count !== 1) {
      const current = await this.prisma.appointment.findUnique({
        where: { id: appointment.id },
        select: { status: true },
      });
      if (current?.status === AppointmentStatus.CONFIRMED) {
        return { appointmentId: appointment.id, status: 'CONFIRMED' };
      }
      throw new ConflictException('Cuộc hẹn đã thay đổi trước khi xác nhận thanh toán.');
    }

    if (appointment.redisLockKey) {
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
          `Appointment ${appointment.id} was confirmed but its Redis lock could not be released: ${detail}`,
        );
      }
    }

    await this.events.publish(APPOINTMENT_CONFIRMED_EVENT, {
      appointmentId: appointment.id,
    });
    return { appointmentId: appointment.id, status: 'CONFIRMED' };
  }

  private sign(parameters: PaymentParameters): string {
    return createHmac('sha512', this.getSecret())
      .update(this.canonicalize(parameters))
      .digest('hex');
  }

  private isValidSignature(parameters: PaymentParameters, signature: string): boolean {
    if (!/^[a-f\d]{128}$/i.test(signature)) {
      return false;
    }
    const expected = Buffer.from(this.sign(parameters), 'hex');
    const received = Buffer.from(signature, 'hex');
    return expected.length === received.length && timingSafeEqual(expected, received);
  }

  private canonicalize(parameters: PaymentParameters): string {
    return Object.entries(parameters)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .map(([key, value]) => [key, value] as const)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value).replace(/%20/g, '+')}`,
      )
      .join('&');
  }

  private getSecret(): string {
    const secret = process.env.PAYMENT_CALLBACK_SECRET;
    if (!secret || secret.trim().length < 16) {
      throw new InternalServerErrorException(
        'PAYMENT_CALLBACK_SECRET must contain at least 16 characters.',
      );
    }
    return secret;
  }

  private toMinorUnits(amount: number): number {
    const minorUnits = Math.round(amount * 100);
    if (!Number.isSafeInteger(minorUnits) || minorUnits <= 0) {
      throw new InternalServerErrorException('Phí khám không hợp lệ để tạo giao dịch thanh toán.');
    }
    return minorUnits;
  }

  private formatVnpDate(date: Date): string {
    const vietnamTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const year = vietnamTime.getUTCFullYear();
    const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
    const hours = String(vietnamTime.getUTCHours()).padStart(2, '0');
    const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(vietnamTime.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}
