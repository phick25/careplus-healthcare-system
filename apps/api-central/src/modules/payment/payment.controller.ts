import {
  Body,
  Controller,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type {
  PaymentCallbackResponseDTO,
  PaymentUrlResponseDTO,
} from '@packages/shared-types';
import { PaymentCallbackDto } from './payment.dto';
import { PaymentService } from './payment.service';

@Controller('api/v1/payments')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':appointmentId/url')
  createPaymentUrl(
    @Param('appointmentId') appointmentId: string,
  ): Promise<PaymentUrlResponseDTO> {
    return this.paymentService.createPaymentUrl(appointmentId);
  }

  @Post('callback')
  handleCallback(
    @Body() paymentResponseDto: PaymentCallbackDto,
  ): Promise<PaymentCallbackResponseDTO> {
    return this.paymentService.handlePaymentCallback(paymentResponseDto);
  }
}
