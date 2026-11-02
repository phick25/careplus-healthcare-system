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
var ReminderWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderWorker = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const schedule_1 = require("@nestjs/schedule");
const booking_infrastructure_1 = require("../booking/booking.infrastructure");
const mock_notification_provider_1 = require("./mock-notification.provider");
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
let ReminderWorker = ReminderWorker_1 = class ReminderWorker {
    prisma;
    notifications;
    logger = new common_1.Logger(ReminderWorker_1.name);
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async sendNextDayReminders() {
        const nowInVietnam = new Date(Date.now() + VIETNAM_OFFSET_MS);
        const tomorrowMidnightUtc = Date.UTC(nowInVietnam.getUTCFullYear(), nowInVietnam.getUTCMonth(), nowInVietnam.getUTCDate() + 1);
        const start = new Date(tomorrowMidnightUtc - VIETNAM_OFFSET_MS);
        const end = new Date(start.getTime() + DAY_MS);
        const appointments = await this.prisma.appointment.findMany({
            where: {
                status: client_1.AppointmentStatus.CONFIRMED,
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
            await this.notifications.sendSms(phoneNumber, `Xin chào ${appointment.patient.fullName}, bạn có lịch khám với bác sĩ ${appointment.doctor.fullName} vào ${appointmentTime} ngày mai. Vui lòng có mặt trước giờ khám 15 phút. Mã cuộc hẹn: ${appointment.id}.`);
        }
    }
};
exports.ReminderWorker = ReminderWorker;
__decorate([
    (0, schedule_1.Cron)('0 9 * * *', { timeZone: 'Asia/Ho_Chi_Minh' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReminderWorker.prototype, "sendNextDayReminders", null);
exports.ReminderWorker = ReminderWorker = ReminderWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [booking_infrastructure_1.BookingPrismaService,
        mock_notification_provider_1.MockNotificationProvider])
], ReminderWorker);
