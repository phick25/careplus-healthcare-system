import { createHmac } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { Test } from '@nestjs/testing';
import type { AppointmentStatus } from '@packages/shared-types';
import { AppointmentEventBus } from '../src/modules/booking/appointment-event-bus';
import { BookingCleanupWorker } from '../src/modules/booking/booking-cleanup.worker';
import {
  BookingPrismaService,
  BookingRedisService,
} from '../src/modules/booking/booking.infrastructure';
import { ReminderWorker } from '../src/modules/notification/reminder.worker';
import { MockNotificationProvider } from '../src/modules/notification/mock-notification.provider';
import { AppModule } from '../src/app.module';
import request from 'supertest';

const PAYMENT_SECRET = 'e2e-payment-secret-with-at-least-16-chars';
const CONSULTATION_FEE = 125_000;

interface FakePatient {
  id: string;
  cccd: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
}

interface FakeAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  slotStartTime: Date;
  slotEndTime: Date;
  status: AppointmentStatus;
  redisLockKey: string | null;
  holdExpiresAt: Date | null;
  idempotencyKey: string;
  patient: FakePatient;
  doctor: {
    fullName: string;
    baseConsultationFee: number;
    currency: string;
  };
}

interface AppointmentWhere {
  id?: string;
  idempotencyKey?: string;
  status?: AppointmentStatus;
  holdExpiresAt?: { gt?: Date; lte?: Date };
  slotStartTime?: { gte: Date; lt: Date };
}

interface CreateAppointmentData {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  slotStartTime: Date;
  slotEndTime: Date;
  status: AppointmentStatus;
  redisLockKey: string;
  holdExpiresAt: Date;
  idempotencyKey: string;
}

interface FakePatientDelegate {
  upsert(args: {
    where: { cccd: string };
    create: { cccd: string; fullName: string; phoneNumber: string };
    update: { fullName: string; phoneNumber: string };
  }): Promise<FakePatient>;
}

interface FakeAppointmentDelegate {
  create(args: { data: CreateAppointmentData }): Promise<FakeAppointment>;
}

interface FakeTransaction {
  patient: FakePatientDelegate;
  appointment: FakeAppointmentDelegate;
}

class FakePrisma {
  readonly appointments = new Map<string, FakeAppointment>();
  private readonly patients = new Map<string, FakePatient>();
  readonly doctor = {
    findUnique: async () => ({
      id: '00000000-0000-4000-8000-000000000001',
      hospitalId: '00000000-0000-4000-8000-000000000002',
      baseConsultationFee: CONSULTATION_FEE,
      currency: 'VND',
      isActive: true,
    }),
  };
  readonly patient = {
    upsert: async (args: {
      where: { cccd: string };
      create: { cccd: string; fullName: string; phoneNumber: string };
      update: { fullName: string; phoneNumber: string };
    }): Promise<FakePatient> => {
      const current = this.patients.get(args.where.cccd);
      if (current) {
        current.fullName = args.update.fullName;
        current.phoneNumber = args.update.phoneNumber;
        return current;
      }

      const patient: FakePatient = {
        id: `patient-${this.patients.size + 1}`,
        cccd: args.create.cccd,
        fullName: args.create.fullName,
        phoneNumber: args.create.phoneNumber,
        email: 'patient@example.test',
      };
      this.patients.set(patient.cccd, patient);
      return patient;
    },
  };
  readonly appointment = {
    findUnique: async (args: { where: AppointmentWhere }): Promise<FakeAppointment | null> => {
      if (args.where.id) {
        const appointment = this.appointments.get(args.where.id);
        return appointment ? { ...appointment } : null;
      }
      if (args.where.idempotencyKey) {
        const appointment = [...this.appointments.values()].find(
          (value) => value.idempotencyKey === args.where.idempotencyKey,
        );
        return appointment ? { ...appointment } : null;
      }
      return null;
    },
    create: async (args: { data: CreateAppointmentData }): Promise<FakeAppointment> => {
      const patient = [...this.patients.values()].find(
        (value) => value.id === args.data.patientId,
      );
      if (!patient) {
        throw new Error('Expected patient upsert to happen before appointment creation.');
      }
      const appointment: FakeAppointment = {
        ...args.data,
        patient,
        doctor: {
          fullName: 'Bác sĩ Nguyễn An',
          baseConsultationFee: CONSULTATION_FEE,
          currency: 'VND',
        },
      };
      this.appointments.set(appointment.id, appointment);
      return appointment;
    },
    updateMany: async (args: {
      where: AppointmentWhere & { id: string };
      data: Partial<FakeAppointment> & { cancellationReason?: string };
    }): Promise<{ count: number }> => {
      const appointment = this.appointments.get(args.where.id);
      if (!appointment || appointment.status !== args.where.status) {
        return { count: 0 };
      }
      if (
        args.where.holdExpiresAt?.lte &&
        (!appointment.holdExpiresAt ||
          appointment.holdExpiresAt > args.where.holdExpiresAt.lte)
      ) {
        return { count: 0 };
      }
      if (
        args.where.holdExpiresAt?.gt &&
        (!appointment.holdExpiresAt ||
          appointment.holdExpiresAt <= args.where.holdExpiresAt.gt)
      ) {
        return { count: 0 };
      }
      Object.assign(appointment, args.data);
      return { count: 1 };
    },
    findMany: async (args: { where: AppointmentWhere }): Promise<FakeAppointment[]> =>
      [...this.appointments.values()].filter((appointment) => {
        if (args.where.status && appointment.status !== args.where.status) {
          return false;
        }
        if (
          args.where.holdExpiresAt?.lte &&
          (!appointment.holdExpiresAt ||
            appointment.holdExpiresAt > args.where.holdExpiresAt.lte)
        ) {
          return false;
        }
        if (
          args.where.slotStartTime &&
          (appointment.slotStartTime < args.where.slotStartTime.gte ||
            appointment.slotStartTime >= args.where.slotStartTime.lt)
        ) {
          return false;
        }
        return true;
      }).map((appointment) => ({ ...appointment })),
  };

  async $transaction<T>(
    operation: (transaction: FakeTransaction) => Promise<T>,
  ): Promise<T> {
    return operation({
      patient: this.patient,
      appointment: { create: this.appointment.create },
    });
  }

  reset(): void {
    this.appointments.clear();
    this.patients.clear();
  }
}

class FakeRedis {
  readonly locks = new Map<string, string>();
  readonly client = {
    set: async (
      key: string,
      value: string,
      _expiryMode: string,
      _ttlSeconds: number,
      _condition: string,
    ): Promise<'OK' | null> => {
      if (this.locks.has(key)) {
        return null;
      }
      this.locks.set(key, value);
      return 'OK';
    },
    eval: async (
      _script: string,
      _keyCount: number,
      key: string,
      expectedValue: string,
    ): Promise<number> => {
      if (this.locks.get(key) !== expectedValue) {
        return 0;
      }
      this.locks.delete(key);
      return 1;
    },
  };

  reset(): void {
    this.locks.clear();
  }
}

function createBookingPayload(idempotencyKey: string) {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return {
    nationalId: '012345678901',
    fullName: 'Nguyễn Thị An',
    phone: '0912345678',
    doctorId: '00000000-0000-4000-8000-000000000001',
    slotId: 'slot-tomorrow-morning',
    timeSlot: { startTime: start.toISOString(), endTime: end.toISOString() },
    idempotencyKey,
  };
}

function signCallback(parameters: Record<string, string>): string {
  const canonical = Object.keys(parameters)
    .sort()
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(parameters[key] ?? '').replace(/%20/g, '+')}`,
    )
    .join('&');
  return createHmac('sha512', PAYMENT_SECRET).update(canonical).digest('hex');
}

describe('Booking payment flow (e2e)', () => {
  let app: INestApplication;
  let prisma: FakePrisma;
  let redis: FakeRedis;
  let emailMessages: string[];
  let smsMessages: string[];

  beforeAll(async () => {
    process.env.PAYMENT_CALLBACK_SECRET = PAYMENT_SECRET;
    process.env.JWT_SECRET = 'e2e-jwt-secret-with-at-least-32-characters';
    prisma = new FakePrisma();
    redis = new FakeRedis();
    emailMessages = [];
    smsMessages = [];
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(BookingPrismaService)
      .useValue(prisma)
      .overrideProvider(BookingRedisService)
      .useValue(redis)
      .overrideProvider(MockNotificationProvider)
      .useValue({
        sendEmail: async (_recipient: string, _subject: string, message: string) => {
          emailMessages.push(message);
        },
        sendSms: async (_recipient: string, message: string) => {
          smsMessages.push(message);
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    prisma.reset();
    redis.reset();
    emailMessages.length = 0;
    smsMessages.length = 0;
  });

  afterAll(async () => {
    await app.close();
    delete process.env.PAYMENT_CALLBACK_SECRET;
    delete process.env.JWT_SECRET;
  });

  it('holds a slot for payment for ten minutes', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/bookings/hold')
      .send(createBookingPayload('hold-success'))
      .expect(201);

    expect(response.body.status).toBe('PENDING_PAYMENT');
    expect(response.body.appointmentId).toBeDefined();
    const remainingMs = Date.parse(response.body.holdExpiresAt) - Date.now();
    expect(remainingMs).toBeGreaterThan(9 * 60 * 1000);
    expect(remainingMs).toBeLessThanOrEqual(10 * 60 * 1000);
  });

  it('allows only one concurrent hold for the same doctor and time slot', async () => {
    const firstPayload = createBookingPayload('race-first');
    const secondPayload = { ...firstPayload, idempotencyKey: 'race-second' };
    const responses = await Promise.all([
      request(app.getHttpServer()).post('/api/v1/bookings/hold').send(firstPayload),
      request(app.getHttpServer()).post('/api/v1/bookings/hold').send(secondPayload),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
  });

  it('expires an unpaid hold and releases its Redis lock', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/bookings/hold')
      .send(createBookingPayload('hold-expired'))
      .expect(201);
    const appointment = prisma.appointments.get(response.body.appointmentId);
    if (!appointment?.redisLockKey) {
      throw new Error('Expected the held appointment to own a Redis lock.');
    }

    appointment.holdExpiresAt = new Date(Date.now() - 1);
    await app.get(BookingCleanupWorker).cleanupExpiredBookings();

    expect(appointment.status).toBe('CANCELLED');
    expect(appointment.redisLockKey).toBeNull();
    expect(redis.locks.has(`lock:slot:${appointment.doctorId}:${appointment.slotStartTime.toISOString()}`))
      .toBe(false);
  });

  it('confirms an appointment after a valid successful payment callback', async () => {
    const booking = await request(app.getHttpServer())
      .post('/api/v1/bookings/hold')
      .send(createBookingPayload('payment-success'))
      .expect(201);
    const urlResponse = await request(app.getHttpServer())
      .post(`/api/v1/payments/${booking.body.appointmentId}/url`)
      .expect(201);
    const paymentUrl = new URL(urlResponse.body.paymentUrl);
    const callback: Record<string, string> = {
      vnp_Amount: paymentUrl.searchParams.get('vnp_Amount') ?? '',
      vnp_BankCode: 'NCB',
      vnp_Command: 'pay',
      vnp_CurrCode: 'VND',
      vnp_OrderInfo: paymentUrl.searchParams.get('vnp_OrderInfo') ?? '',
      vnp_ResponseCode: '00',
      vnp_TmnCode: paymentUrl.searchParams.get('vnp_TmnCode') ?? '',
      vnp_TransactionNo: '12345678',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: booking.body.appointmentId,
      vnp_Version: '2.1.0',
    };
    const callbackResponse = await request(app.getHttpServer())
      .post('/api/v1/payments/callback')
      .send({
        ...callback,
        vnp_SecureHashType: 'HMACSHA512',
        vnp_SecureHash: signCallback(callback),
      })
      .expect(201);

    expect(callbackResponse.body.status).toBe('CONFIRMED');
    expect(prisma.appointments.get(booking.body.appointmentId)?.status).toBe(
      'CONFIRMED',
    );
    expect(emailMessages[0]).toContain('Nguyễn Thị An');
    expect(emailMessages[0]).toContain('Bác sĩ Nguyễn An');
    expect(emailMessages[0]).toContain(`Mã cuộc hẹn: ${booking.body.appointmentId}`);
    expect(emailMessages[0]).toContain(`Mã QR Check-in: CHECKIN-${booking.body.appointmentId}`);
    expect(smsMessages).toHaveLength(1);
  });

  it('rejects a callback with an invalid checksum without confirming the appointment', async () => {
    const booking = await request(app.getHttpServer())
      .post('/api/v1/bookings/hold')
      .send(createBookingPayload('payment-invalid-checksum'))
      .expect(201);
    const urlResponse = await request(app.getHttpServer())
      .post(`/api/v1/payments/${booking.body.appointmentId}/url`)
      .expect(201);
    const paymentUrl = new URL(urlResponse.body.paymentUrl);

    await request(app.getHttpServer())
      .post('/api/v1/payments/callback')
      .send({
        vnp_Amount: paymentUrl.searchParams.get('vnp_Amount'),
        vnp_ResponseCode: '00',
        vnp_SecureHash: '0'.repeat(128),
        vnp_SecureHashType: 'HMACSHA512',
        vnp_TmnCode: paymentUrl.searchParams.get('vnp_TmnCode'),
        vnp_TransactionStatus: '00',
        vnp_TxnRef: booking.body.appointmentId,
      })
      .expect(409);

    expect(prisma.appointments.get(booking.body.appointmentId)?.status).toBe(
      'PENDING_PAYMENT',
    );
  });

  it('sends a reminder for a confirmed appointment scheduled for tomorrow', async () => {
    const booking = await request(app.getHttpServer())
      .post('/api/v1/bookings/hold')
      .send(createBookingPayload('reminder-tomorrow'))
      .expect(201);
    const appointment = prisma.appointments.get(booking.body.appointmentId);
    if (!appointment) {
      throw new Error('Expected the held appointment to exist.');
    }
    appointment.status = 'CONFIRMED';

    await app.get(ReminderWorker).sendNextDayReminders();

    expect(smsMessages).toHaveLength(1);
    expect(smsMessages[0]).toContain('ngày mai');
    expect(smsMessages[0]).toContain('có mặt trước giờ khám 15 phút');
  });
});
