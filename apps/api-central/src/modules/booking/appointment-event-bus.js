"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AppointmentEventBus_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentEventBus = exports.APPOINTMENT_CONFIRMED_EVENT = void 0;
const common_1 = require("@nestjs/common");
exports.APPOINTMENT_CONFIRMED_EVENT = 'appointment.confirmed';
let AppointmentEventBus = AppointmentEventBus_1 = class AppointmentEventBus {
    logger = new common_1.Logger(AppointmentEventBus_1.name);
    confirmedHandlers = new Set();
    subscribe(eventName, handler) {
        if (eventName !== exports.APPOINTMENT_CONFIRMED_EVENT) {
            throw new Error(`Unsupported appointment event: ${eventName}`);
        }
        this.confirmedHandlers.add(handler);
        return () => this.confirmedHandlers.delete(handler);
    }
    async publish(eventName, event) {
        if (eventName !== exports.APPOINTMENT_CONFIRMED_EVENT) {
            throw new Error(`Unsupported appointment event: ${eventName}`);
        }
        for (const handler of this.confirmedHandlers) {
            try {
                await handler(event);
            }
            catch (error) {
                const detail = error instanceof Error ? error.message : String(error);
                this.logger.error(`Could not process ${eventName} for ${event.appointmentId}: ${detail}`);
            }
        }
    }
};
exports.AppointmentEventBus = AppointmentEventBus;
exports.AppointmentEventBus = AppointmentEventBus = AppointmentEventBus_1 = __decorate([
    (0, common_1.Injectable)()
], AppointmentEventBus);
