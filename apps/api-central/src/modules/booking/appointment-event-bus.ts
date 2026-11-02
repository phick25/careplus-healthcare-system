import { Injectable, Logger } from '@nestjs/common';

export const APPOINTMENT_CONFIRMED_EVENT = 'appointment.confirmed';

export interface AppointmentConfirmedEvent {
  appointmentId: string;
}

type AppointmentConfirmedHandler = (
  event: AppointmentConfirmedEvent,
) => void | Promise<void>;

@Injectable()
export class AppointmentEventBus {
  private readonly logger = new Logger(AppointmentEventBus.name);
  private readonly confirmedHandlers = new Set<AppointmentConfirmedHandler>();

  subscribe(
    eventName: typeof APPOINTMENT_CONFIRMED_EVENT,
    handler: AppointmentConfirmedHandler,
  ): () => void {
    if (eventName !== APPOINTMENT_CONFIRMED_EVENT) {
      throw new Error(`Unsupported appointment event: ${eventName}`);
    }
    this.confirmedHandlers.add(handler);
    return () => this.confirmedHandlers.delete(handler);
  }

  async publish(
    eventName: typeof APPOINTMENT_CONFIRMED_EVENT,
    event: AppointmentConfirmedEvent,
  ): Promise<void> {
    if (eventName !== APPOINTMENT_CONFIRMED_EVENT) {
      throw new Error(`Unsupported appointment event: ${eventName}`);
    }
    for (const handler of this.confirmedHandlers) {
      try {
        await handler(event);
      } catch (error: unknown) {
        const detail = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Could not process ${eventName} for ${event.appointmentId}: ${detail}`,
        );
      }
    }
  }
}
