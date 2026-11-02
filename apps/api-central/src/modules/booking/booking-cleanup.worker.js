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
var BookingCleanupWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingCleanupWorker = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const schedule_1 = require("@nestjs/schedule");
const booking_infrastructure_1 = require("./booking.infrastructure");
const RELEASE_OWNED_LOCK_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0
`;
let BookingCleanupWorker = BookingCleanupWorker_1 = class BookingCleanupWorker {
    prisma;
    redis;
    logger = new common_1.Logger(BookingCleanupWorker_1.name);
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async cleanupExpiredBookings() {
        const now = new Date();
        const expiredAppointments = await this.prisma.appointment.findMany({
            where: {
                status: client_1.AppointmentStatus.PENDING_PAYMENT,
                holdExpiresAt: { lte: now },
            },
            select: { id: true, redisLockKey: true },
        });
        for (const appointment of expiredAppointments) {
            const result = await this.prisma.appointment.updateMany({
                where: {
                    id: appointment.id,
                    status: client_1.AppointmentStatus.PENDING_PAYMENT,
                    holdExpiresAt: { lte: now },
                },
                data: {
                    status: client_1.AppointmentStatus.CANCELLED,
                    cancellationReason: 'Hết hạn thanh toán',
                    redisLockKey: null,
                    holdExpiresAt: null,
                },
            });
            if (result.count !== 1 || !appointment.redisLockKey) {
                continue;
            }
            try {
                await this.redis.client.eval(RELEASE_OWNED_LOCK_SCRIPT, 1, appointment.redisLockKey, appointment.id);
            }
            catch (error) {
                const detail = error instanceof Error ? error.message : String(error);
                this.logger.error(`Booking ${appointment.id} expired but its Redis lock could not be released: ${detail}`);
            }
        }
    }
};
exports.BookingCleanupWorker = BookingCleanupWorker;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingCleanupWorker.prototype, "cleanupExpiredBookings", null);
exports.BookingCleanupWorker = BookingCleanupWorker = BookingCleanupWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [booking_infrastructure_1.BookingPrismaService,
        booking_infrastructure_1.BookingRedisService])
], BookingCleanupWorker);
