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
var AppointmentConfirmedListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentConfirmedListener = void 0;
const common_1 = require("@nestjs/common");
const appointment_event_bus_1 = require("../booking/appointment-event-bus");
const booking_infrastructure_1 = require("../booking/booking.infrastructure");
const mock_notification_provider_1 = require("./mock-notification.provider");
let AppointmentConfirmedListener = AppointmentConfirmedListener_1 = class AppointmentConfirmedListener {
    events;
    prisma;
    notifications;
    logger = new common_1.Logger(AppointmentConfirmedListener_1.name);
    unsubscribe;
    constructor(events, prisma, notifications) {
        this.events = events;
        this.prisma = prisma;
        this.notifications = notifications;
    }
    onModuleInit() {
        this.unsubscribe = this.events.subscribe(appointment_event_bus_1.APPOINTMENT_CONFIRMED_EVENT, ({ appointmentId }) => this.sendConfirmation(appointmentId));
    }
    onModuleDestroy() {
        this.unsubscribe?.();
    }
    async sendConfirmation(appointmentId) {
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
            await this.notifications.sendEmail(appointment.patient.email, `Xác nhận lịch khám ${appointment.id}`, message);
        }
        else {
            this.logger.warn(`Appointment ${appointment.id} has no patient email; email was skipped.`);
        }
        if (appointment.patient.phoneNumber) {
            await this.notifications.sendSms(appointment.patient.phoneNumber, message);
        }
        else {
            this.logger.warn(`Appointment ${appointment.id} has no patient phone; SMS was skipped.`);
        }
    }
};
exports.AppointmentConfirmedListener = AppointmentConfirmedListener;
exports.AppointmentConfirmedListener = AppointmentConfirmedListener = AppointmentConfirmedListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [appointment_event_bus_1.AppointmentEventBus,
        booking_infrastructure_1.BookingPrismaService,
        mock_notification_provider_1.MockNotificationProvider])
], AppointmentConfirmedListener);
