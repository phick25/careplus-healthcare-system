import { Type } from 'class-transformer';
import {
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  Validate,
  ValidateNested,
  ValidatorConstraint,
} from 'class-validator';
import type { ValidationArguments, ValidatorConstraintInterface } from 'class-validator';
import type { BookingRequestDTO } from '@packages/shared-types';

type BookingTimeSlot = BookingRequestDTO['timeSlot'];

@ValidatorConstraint({ name: 'isFutureDateTime', async: false })
class IsFutureDateTimeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && new Date(value).getTime() > Date.now();
  }

  defaultMessage(): string {
    return 'startTime must be in the future';
  }
}

@ValidatorConstraint({ name: 'isAfterProperty', async: false })
class IsAfterPropertyConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const otherValue = 'startTime' in args.object ? args.object.startTime : undefined;
    return (
      typeof value === 'string' &&
      typeof otherValue === 'string' &&
      new Date(value).getTime() > new Date(otherValue).getTime()
    );
  }

  defaultMessage(): string {
    return 'endTime must be later than startTime';
  }
}

class BookingTimeSlotDto implements BookingTimeSlot {
  @IsString()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/)
  @Validate(IsFutureDateTimeConstraint)
  startTime!: string;

  @IsString()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/)
  @Validate(IsAfterPropertyConstraint, ['startTime'])
  endTime!: string;
}

export class CreateBookingDto implements BookingRequestDTO {
  @IsString()
  @Matches(/^\d{12}$/)
  nationalId!: string;

  @IsString()
  @Length(1, 200)
  fullName!: string;

  @IsString()
  @Matches(/^(?:\+?84|0)(?:3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])\d{7}$/)
  phone!: string;

  @IsUUID()
  doctorId!: string;

  @IsString()
  @Length(1, 128)
  slotId!: string;

  @Type(() => BookingTimeSlotDto)
  @IsObject()
  @ValidateNested()
  timeSlot!: BookingTimeSlotDto;

  @IsString()
  @Length(1, 128)
  idempotencyKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  preliminaryReason?: string;
}
