import {
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class PaymentCallbackDto {
  @IsString()
  @IsUUID()
  vnp_TxnRef!: string;

  @IsString()
  @Matches(/^\d+$/)
  vnp_Amount!: string;

  @IsString()
  @Length(2, 2)
  vnp_ResponseCode!: string;

  @IsString()
  @Length(2, 2)
  vnp_TransactionStatus!: string;

  @IsString()
  @Matches(/^[a-f\d]{128}$/i)
  vnp_SecureHash!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  vnp_SecureHashType?: string;

  @IsOptional()
  @IsString()
  @Length(1, 16)
  vnp_Version?: string;

  @IsOptional()
  @IsString()
  @Length(1, 16)
  vnp_Command?: string;

  @IsString()
  @Length(1, 8)
  vnp_TmnCode!: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  vnp_CurrCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  vnp_OrderInfo?: string;

  @IsOptional()
  @IsString()
  @Length(1, 16)
  vnp_OrderType?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{8,14}$/)
  vnp_PayDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  vnp_BankCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  vnp_BankTranNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  vnp_CardType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  vnp_TransactionNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  vnp_IpAddr?: string;
}
