const bcrypt = require('bcrypt');
const { AuthRole, PrismaClient } = require('@prisma/client');

const BCRYPT_ROUNDS = 12;
const HOSPITAL_CODE = 'CAREPLUS-DEMO';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be configured before running the seed.');
  }

  const prisma = new PrismaClient();

  try {
    const hospital = await prisma.hospital.upsert({
      where: { code: HOSPITAL_CODE },
      update: {
        name: 'CarePlus Demo Hospital',
        province: 'Hồ Chí Minh',
        provinceCode: '79',
        district: 'Quận 1',
        address: 'Địa chỉ demo',
      },
      create: {
        code: HOSPITAL_CODE,
        name: 'CarePlus Demo Hospital',
        province: 'Hồ Chí Minh',
        provinceCode: '79',
        district: 'Quận 1',
        address: 'Địa chỉ demo',
      },
    });

    const department = await prisma.department.upsert({
      where: {
        hospitalId_code: {
          hospitalId: hospital.id,
          code: 'CARDIOLOGY',
        },
      },
      update: { name: 'Tim mạch', isActive: true },
      create: {
        hospitalId: hospital.id,
        code: 'CARDIOLOGY',
        name: 'Tim mạch',
      },
    });

    await prisma.doctor.upsert({
      where: {
        hospitalId_employeeCode: {
          hospitalId: hospital.id,
          employeeCode: 'DR-KHOI',
        },
      },
      update: {
        departmentId: department.id,
        fullName: 'Bác sĩ Khôi',
        title: 'Bác sĩ',
        baseConsultationFee: 300000,
        isActive: true,
      },
      create: {
        hospitalId: hospital.id,
        departmentId: department.id,
        employeeCode: 'DR-KHOI',
        fullName: 'Bác sĩ Khôi',
        title: 'Bác sĩ',
        baseConsultationFee: 300000,
      },
    });

    const staffAccounts = [
      {
        email: 'dr.khoi@careplus.vn',
        password: 'Doctor@123',
        role: AuthRole.DOCTOR,
      },
      {
        email: 'reception@careplus.vn',
        password: 'Reception@123',
        role: AuthRole.RECEPTIONIST,
      },
      {
        email: 'admin@careplus.vn',
        password: 'Admin@123',
        role: AuthRole.HOSPITAL_ADMIN,
      },
    ];

    for (const account of staffAccounts) {
      const passwordHash = await bcrypt.hash(account.password, BCRYPT_ROUNDS);
      await prisma.hospitalStaffAccount.upsert({
        where: { email: account.email },
        update: {
          hospitalId: hospital.id,
          passwordHash,
          role: account.role,
          isActive: true,
        },
        create: {
          hospitalId: hospital.id,
          email: account.email,
          passwordHash,
          role: account.role,
        },
      });
    }

    console.info('Seeded CarePlus demo hospital, cardiology doctor, and staff accounts.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Failed to seed demo staff accounts:', error);
  process.exitCode = 1;
});
