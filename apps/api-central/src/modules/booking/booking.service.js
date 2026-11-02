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
var BookingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const booking_infrastructure_1 = require("./booking.infrastructure");
const HOLD_TTL_SECONDS = 600;
const RELEASE_OWNED_LOCK_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0
`;
let BookingService = BookingService_1 = class BookingService {
    prisma;
    redis;
    logger = new common_1.Logger(BookingService_1.name);
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async holdSlot(dto) {
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
            throw new common_1.NotFoundException('Bác sĩ không tồn tại hoặc không hoạt động.');
        }
        const slotStartTime = new Date(dto.timeSlot.startTime);
        const slotEndTime = new Date(dto.timeSlot.endTime);
        if (slotStartTime <= new Date() || slotEndTime <= slotStartTime) {
            throw new common_1.BadRequestException('Khung giờ khám không hợp lệ hoặc đã qua.');
        }
        const previousBooking = await this.findIdempotentBooking(dto);
        if (previousBooking) {
            return this.toResponse(previousBooking, doctor);
        }
        const redisLockKey = `lock:slot:${dto.doctorId}:${dto.timeSlot.startTime}`;
        const appointmentId = (0, node_crypto_1.randomUUID)();
        const lockResult = await this.redis.client.set(redisLockKey, appointmentId, 'EX', HOLD_TTL_SECONDS, 'NX');
        if (lockResult !== 'OK') {
            const concurrentBooking = await this.findIdempotentBooking(dto);
            if (concurrentBooking) {
                return this.toResponse(concurrentBooking, doctor);
            }
            throw new common_1.ConflictException('Khung giờ này đang có người giữ hoặc đã được đặt.');
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
                        status: client_1.AppointmentStatus.PENDING_PAYMENT,
                        redisLockKey,
                        holdExpiresAt,
                        idempotencyKey: dto.idempotencyKey,
                        preliminaryReason: dto.preliminaryReason,
                    },
                });
            });
            return this.toResponse(appointment, doctor);
        }
        catch (error) {
            await this.releaseLock(redisLockKey, appointmentId);
            if (this.isSlotConflict(error)) {
                throw new common_1.ConflictException('Khung giờ này đang có người giữ hoặc đã được đặt.');
            }
            throw error;
        }
    }
    async findIdempotentBooking(dto) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { idempotencyKey: dto.idempotencyKey },
            include: { patient: { select: { cccd: true } } },
        });
        if (!appointment) {
            return null;
        }
        const sameRequest = appointment.doctorId === dto.doctorId &&
            appointment.patient.cccd === dto.nationalId &&
            appointment.slotStartTime.getTime() === new Date(dto.timeSlot.startTime).getTime() &&
            appointment.slotEndTime.getTime() === new Date(dto.timeSlot.endTime).getTime();
        if (!sameRequest) {
            throw new common_1.ConflictException('idempotencyKey đã được sử dụng cho yêu cầu đặt lịch khác.');
        }
        return appointment;
    }
    toResponse(appointment, doctor) {
        if (!appointment.holdExpiresAt) {
            throw new common_1.ConflictException('Cuộc hẹn không có thời điểm hết hạn giữ chỗ.');
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
    isSlotConflict(error) {
        return (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            (error.code === 'P2002' || error.code === 'P2004'));
    }
    async releaseLock(key, appointmentId) {
        try {
            await this.redis.client.eval(RELEASE_OWNED_LOCK_SCRIPT, 1, key, appointmentId);
        }
        catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            this.logger.error(`Could not release Redis booking lock ${key}: ${detail}`);
        }
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = BookingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [booking_infrastructure_1.BookingPrismaService,
        booking_infrastructure_1.BookingRedisService])
], BookingService);
