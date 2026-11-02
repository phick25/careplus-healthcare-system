"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentCallbackDto = void 0;
const class_validator_1 = require("class-validator");
class PaymentCallbackDto {
    vnp_TxnRef;
    vnp_Amount;
    vnp_ResponseCode;
    vnp_TransactionStatus;
    vnp_SecureHash;
    vnp_SecureHashType;
    vnp_Version;
    vnp_Command;
    vnp_TmnCode;
    vnp_CurrCode;
    vnp_OrderInfo;
    vnp_OrderType;
    vnp_PayDate;
    vnp_BankCode;
    vnp_BankTranNo;
    vnp_CardType;
    vnp_TransactionNo;
    vnp_IpAddr;
}
exports.PaymentCallbackDto = PaymentCallbackDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_TxnRef", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d+$/),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_Amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 2),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_ResponseCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 2),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_TransactionStatus", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-f\d]{128}$/i),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_SecureHash", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_SecureHashType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 16),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_Version", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 16),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_Command", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 8),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_TmnCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 3),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_CurrCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_OrderInfo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 16),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_OrderType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{8,14}$/),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_PayDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_BankCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_BankTranNo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_CardType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_TransactionNo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(16),
    __metadata("design:type", String)
], PaymentCallbackDto.prototype, "vnp_IpAddr", void 0);
