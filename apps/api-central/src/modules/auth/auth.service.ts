import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterPatientDto } from './auth.dto';
import type { AuthTokenResponse, AuthenticatedUser } from './auth.types';
import { BookingPrismaService } from '../booking/booking.infrastructure';

const BCRYPT_ROUNDS = 12;
const TOKEN_LIFETIME_SECONDS = 900;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: BookingPrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerPatient(dto: RegisterPatientDto): Promise<AuthTokenResponse> {
    const email = dto.email?.trim().toLowerCase() || undefined;
    const cccd = dto.cccd?.trim() || undefined;
    this.validateIdentifier(email, cccd);
    this.validatePasswordLength(dto.password);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    let patient: { id: string };
    try {
      patient = await this.prisma.patient.create({
        data: {
          fullName: dto.fullName.trim(),
          email,
          cccd,
          passwordHash,
          phoneNumber: dto.phoneNumber?.trim(),
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
          gender: dto.gender,
        },
        select: { id: true },
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email or CCCD is already registered');
      }

      throw error;
    }

    return this.issueToken({
      sub: patient.id,
      role: AuthRole.PATIENT,
      hospitalId: null,
    });
  }

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const identifier = dto.identifier?.trim();
    const email = (dto.email ?? (identifier?.includes('@') ? identifier : undefined))
      ?.trim()
      .toLowerCase();
    const cccd = (dto.cccd ?? (identifier && !identifier.includes('@') ? identifier : undefined))
      ?.trim();
    this.validateIdentifier(email, cccd);
    this.validatePasswordLength(dto.password);

    if (dto.role === AuthRole.PATIENT) {
      const patient = await this.prisma.patient.findFirst({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(cccd ? [{ cccd }] : []),
          ],
        },
        select: { id: true, passwordHash: true },
      });

      if (!patient?.passwordHash || !(await bcrypt.compare(dto.password, patient.passwordHash))) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return this.issueToken({
        sub: patient.id,
        role: AuthRole.PATIENT,
        hospitalId: null,
      });
    }

    if (!email || cccd) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const staff = await this.prisma.hospitalStaffAccount.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, role: true, hospitalId: true, isActive: true },
    });
    if (
      !staff
      || !staff.isActive
      || staff.role !== dto.role
      || !(await bcrypt.compare(dto.password, staff.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueToken({
      sub: staff.id,
      role: staff.role,
      hospitalId: staff.hospitalId,
    });
  }

  private validateIdentifier(email?: string, cccd?: string): void {
    if (!email && !cccd) {
      throw new BadRequestException('Provide an email or CCCD');
    }
  }

  private validatePasswordLength(password: string): void {
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new BadRequestException('Password must not exceed 72 UTF-8 bytes');
    }
  }

  private async issueToken(user: AuthenticatedUser): Promise<AuthTokenResponse> {
    const accessToken = await this.jwtService.signAsync(user);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: TOKEN_LIFETIME_SECONDS,
      user,
    };
  }
}
