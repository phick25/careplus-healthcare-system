import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { BookingResponseDTO } from '@packages/shared-types';
import { CreateBookingDto } from './booking.dto';
import { BookingService } from './booking.service';

@Controller('api/v1/bookings')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('hold')
  @HttpCode(HttpStatus.CREATED)
  async hold(@Body() dto: CreateBookingDto): Promise<BookingResponseDTO> {
    return this.bookingService.holdSlot(dto);
  }
}
