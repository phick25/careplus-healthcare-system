CREATE TYPE "AuthRole" AS ENUM ('PATIENT', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR');

ALTER TABLE "Patient"
ADD COLUMN "passwordHash" VARCHAR(255);

CREATE TABLE "HospitalStaffAccount" (
    "id" UUID NOT NULL,
    "hospitalId" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "AuthRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "HospitalStaffAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HospitalStaffAccount_email_key"
ON "HospitalStaffAccount"("email");

CREATE INDEX "HospitalStaffAccount_hospitalId_role_isActive_idx"
ON "HospitalStaffAccount"("hospitalId", "role", "isActive");

ALTER TABLE "HospitalStaffAccount"
ADD CONSTRAINT "HospitalStaffAccount_hospitalId_fkey"
FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
