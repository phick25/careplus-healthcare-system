"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const appointment_event_bus_1 = require("../booking/appointment-event-bus");
const booking_infrastructure_1 = require("../booking/booking.infrastructure");
const RELEASE_OWNED_LOCK_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0
`;
const DEFAULT_MERCHANT_CODE = 'MOCKVN01';
let PaymentService = PaymentService_1 = class PaymentService {
    prisma;
    redis;
    events;
    logger = new common_1.Logger(PaymentService_1.name);
    constructor(prisma, redis, events) {
        this.prisma = prisma;
        this.redis = redis;
        this.events = events;
    }
    async createPaymentUrl(appointmentId) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { doctor: { select: { baseConsultationFee: true, currency: true } } },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Không tìm thấy cuộc hẹn.');
        }
        if (appointment.status !== client_1.AppointmentStatus.PENDING_PAYMENT ||
            !appointment.holdExpiresAt ||
            appointment.holdExpiresAt <= new Date()) {
            throw new common_1.ConflictException('Cuộc hẹn không còn trong thời hạn thanh toán.');
        }
        if (appointment.doctor.currency.trim().toUpperCase() !== 'VND') {
            throw new common_1.InternalServerErrorException('Cổng thanh toán hiện chỉ hỗ trợ đơn vị tiền tệ VND.');
        }
        const now = new Date();
        const parameters = {
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
        const paymentUrl = new URL(process.env.PAYMENT_GATEWAY_URL ?? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
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
    async handlePaymentCallback(paymentResponseDto) {
        const { vnp_SecureHash: signature, vnp_SecureHashType: _hashType, ...parameters } = paymentResponseDto;
        if (!this.isValidSignature(parameters, signature)) {
            throw new common_1.ConflictException('Chữ ký callback thanh toán không hợp lệ.');
        }
        if (paymentResponseDto.vnp_TmnCode !== (process.env.PAYMENT_TMN_CODE || DEFAULT_MERCHANT_CODE)) {
            throw new common_1.ConflictException('Mã đơn vị thanh toán không hợp lệ.');
        }
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: paymentResponseDto.vnp_TxnRef },
            include: { doctor: { select: { baseConsultationFee: true, currency: true } } },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Không tìm thấy cuộc hẹn của giao dịch.');
        }
        if (appointment.doctor.currency.trim().toUpperCase() !== 'VND') {
            throw new common_1.InternalServerErrorException('Cổng thanh toán hiện chỉ hỗ trợ đơn vị tiền tệ VND.');
        }
        const expectedAmount = this.toMinorUnits(Number(appointment.doctor.baseConsultationFee));
        if (Number(paymentResponseDto.vnp_Amount) !== expectedAmount) {
            throw new common_1.ConflictException('Số tiền thanh toán không khớp với cuộc hẹn.');
        }
        const successful = paymentResponseDto.vnp_ResponseCode === '00' &&
            paymentResponseDto.vnp_TransactionStatus === '00';
        if (!successful) {
            return { appointmentId: appointment.id, status: 'DECLINED' };
        }
        if (appointment.status === client_1.AppointmentStatus.CONFIRMED) {
            return { appointmentId: appointment.id, status: 'CONFIRMED' };
        }
        if (appointment.status !== client_1.AppointmentStatus.PENDING_PAYMENT ||
            !appointment.holdExpiresAt ||
            appointment.holdExpiresAt <= new Date()) {
            throw new common_1.ConflictException('Cuộc hẹn không còn hợp lệ để xác nhận thanh toán.');
        }
        const result = await this.prisma.appointment.updateMany({
            where: {
                id: appointment.id,
                status: client_1.AppointmentStatus.PENDING_PAYMENT,
                holdExpiresAt: { gt: new Date() },
            },
            data: {
                status: client_1.AppointmentStatus.CONFIRMED,
                holdExpiresAt: null,
                redisLockKey: null,
            },
        });
        if (result.count !== 1) {
            const current = await this.prisma.appointment.findUnique({
                where: { id: appointment.id },
                select: { status: true },
            });
            if (current?.status === client_1.AppointmentStatus.CONFIRMED) {
                return { appointmentId: appointment.id, status: 'CONFIRMED' };
            }
            throw new common_1.ConflictException('Cuộc hẹn đã thay đổi trước khi xác nhận thanh toán.');
        }
        if (appointment.redisLockKey) {
            try {
                await this.redis.client.eval(RELEASE_OWNED_LOCK_SCRIPT, 1, appointment.redisLockKey, appointment.id);
            }
            catch (error) {
                const detail = error instanceof Error ? error.message : String(error);
                this.logger.error(`Appointment ${appointment.id} was confirmed but its Redis lock could not be released: ${detail}`);
            }
        }
        await this.events.publish(appointment_event_bus_1.APPOINTMENT_CONFIRMED_EVENT, {
            appointmentId: appointment.id,
        });
        return { appointmentId: appointment.id, status: 'CONFIRMED' };
    }
    sign(parameters) {
        return (0, node_crypto_1.createHmac)('sha512', this.getSecret())
            .update(this.canonicalize(parameters))
            .digest('hex');
    }
    isValidSignature(parameters, signature) {
        if (!/^[a-f\d]{128}$/i.test(signature)) {
            return false;
        }
        const expected = Buffer.from(this.sign(parameters), 'hex');
        const received = Buffer.from(signature, 'hex');
        return expected.length === received.length && (0, node_crypto_1.timingSafeEqual)(expected, received);
    }
    canonicalize(parameters) {
        return Object.entries(parameters)
            .filter((entry) => typeof entry[1] === 'string')
            .map(([key, value]) => [key, value])
            .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value).replace(/%20/g, '+')}`)
            .join('&');
    }
    getSecret() {
        const secret = process.env.PAYMENT_CALLBACK_SECRET;
        if (!secret || secret.trim().length < 16) {
            throw new common_1.InternalServerErrorException('PAYMENT_CALLBACK_SECRET must contain at least 16 characters.');
        }
        return secret;
    }
    toMinorUnits(amount) {
        const minorUnits = Math.round(amount * 100);
        if (!Number.isSafeInteger(minorUnits) || minorUnits <= 0) {
            throw new common_1.InternalServerErrorException('Phí khám không hợp lệ để tạo giao dịch thanh toán.');
        }
        return minorUnits;
    }
    formatVnpDate(date) {
        const vietnamTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
        const year = vietnamTime.getUTCFullYear();
        const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
        const hours = String(vietnamTime.getUTCHours()).padStart(2, '0');
        const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, '0');
        const seconds = String(vietnamTime.getUTCSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [booking_infrastructure_1.BookingPrismaService,
        booking_infrastructure_1.BookingRedisService,
        appointment_event_bus_1.AppointmentEventBus])
], PaymentService);
