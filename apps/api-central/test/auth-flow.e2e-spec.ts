import { INestApplication, Controller, Get, UseGuards } from '@nestjs/common';
import { AuthRole } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AuthModule } from '../src/modules/auth/auth.module';
import { Roles } from '../src/modules/auth/roles.decorator';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/roles.guard';
import { BookingPrismaService, BookingRedisService } from '../src/modules/booking/booking.infrastructure';

interface PatientAccount {
  id: string;
  email: string | null;
  cccd: string | null;
  passwordHash: string;
}

interface StaffAccount {
  id: string;
  email: string;
  passwordHash: string;
  role: AuthRole;
  hospitalId: string;
  isActive: boolean;
}

const hospitalId = '00000000-0000-4000-8000-000000000001';
const staffPassword = 'staff-password-123';
let patientAccount: PatientAccount | null = null;
let staffAccount: StaffAccount;

const prismaMock = {
  patient: {
    create: async (args: {
      data: { email?: string; cccd?: string; passwordHash: string };
    }) => {
      patientAccount = {
        id: '00000000-0000-4000-8000-000000000002',
        email: args.data.email ?? null,
        cccd: args.data.cccd ?? null,
        passwordHash: args.data.passwordHash,
      };
      return { id: patientAccount.id };
    },
    findFirst: async (args: { where: { OR: Array<{ email: string } | { cccd: string }> } }) => {
      if (!patientAccount) return null;
      const matches = args.where.OR.some((identifier) =>
        'email' in identifier
          ? patientAccount?.email === identifier.email
          : patientAccount?.cccd === identifier.cccd,
      );
      return matches
        ? { id: patientAccount.id, passwordHash: patientAccount.passwordHash }
        : null;
    },
  },
  hospitalStaffAccount: {
    findUnique: async (args: { where: { email: string } }) =>
      staffAccount.email === args.where.email ? staffAccount : null,
  },
};

@Controller('test/reception')
@UseGuards(JwtAuthGuard, RolesGuard)
class ReceptionProbeController {
  @Get()
  @Roles(AuthRole.RECEPTIONIST)
  reception(): { allowed: true } {
    return { allowed: true };
  }
}

describe('Authentication flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-jwt-secret-with-at-least-32-characters';
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
      controllers: [ReceptionProbeController],
    })
      .overrideProvider(BookingPrismaService)
      .useValue(prismaMock)
      .overrideProvider(BookingRedisService)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    staffAccount = {
      id: '00000000-0000-4000-8000-000000000003',
      email: 'reception@example.test',
      passwordHash: await bcrypt.hash(staffPassword, 4),
      role: AuthRole.RECEPTIONIST,
      hospitalId,
      isActive: true,
    };
  });

  beforeEach(() => {
    patientAccount = null;
  });

  afterAll(async () => {
    await app.close();
    delete process.env.JWT_SECRET;
  });

  it('registers a patient with a hashed password and denies reception access', async () => {
    const registration = await request(app.getHttpServer())
      .post('/api/v1/auth/register/patient')
      .send({
        fullName: 'Test Patient',
        email: 'patient@example.test',
        cccd: '012345678901',
        password: 'patient-password-123',
      })
      .expect(201);

    expect(patientAccount?.passwordHash).not.toBe('patient-password-123');
    expect(patientAccount?.passwordHash).toMatch(/^\$2[aby]\$/);

    await request(app.getHttpServer())
      .get('/test/reception')
      .set('Authorization', `Bearer ${registration.body.accessToken}`)
      .expect(403);
  });

  it('authenticates hospital staff and rejects missing bearer tokens', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: staffAccount.email,
        password: staffPassword,
        role: AuthRole.RECEPTIONIST,
      })
      .expect(200);

    expect(login.body.user).toMatchObject({
      role: AuthRole.RECEPTIONIST,
      hospitalId,
    });

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: staffAccount.email,
        password: staffPassword,
        role: AuthRole.RECEPTIONIST,
      })
      .expect(200);

    staffAccount.isActive = false;
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: staffAccount.email,
        password: staffPassword,
        role: AuthRole.RECEPTIONIST,
      })
      .expect(401);
    staffAccount.isActive = true;

    await request(app.getHttpServer())
      .get('/test/reception')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200, { allowed: true });

    await request(app.getHttpServer()).get('/test/reception').expect(401);
  });
});
