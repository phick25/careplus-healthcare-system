import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterPatientDto } from './auth.dto';
import type { AuthTokenResponse } from './auth.types';

@Controller('api/v1/auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/patient')
  @HttpCode(HttpStatus.CREATED)
  registerPatient(@Body() dto: RegisterPatientDto): Promise<AuthTokenResponse> {
    return this.authService.registerPatient(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthTokenResponse> {
    return this.authService.login(dto);
  }
}
