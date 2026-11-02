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
exports.CreateBookingDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
let IsFutureDateTimeConstraint = class IsFutureDateTimeConstraint {
    validate(value) {
        return typeof value === 'string' && new Date(value).getTime() > Date.now();
    }
    defaultMessage() {
        return 'startTime must be in the future';
    }
};
IsFutureDateTimeConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isFutureDateTime', async: false })
], IsFutureDateTimeConstraint);
let IsAfterPropertyConstraint = class IsAfterPropertyConstraint {
    validate(value, args) {
        const otherValue = 'startTime' in args.object ? args.object.startTime : undefined;
        return (typeof value === 'string' &&
            typeof otherValue === 'string' &&
            new Date(value).getTime() > new Date(otherValue).getTime());
    }
    defaultMessage() {
        return 'endTime must be later than startTime';
    }
};
IsAfterPropertyConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isAfterProperty', async: false })
], IsAfterPropertyConstraint);
class BookingTimeSlotDto {
    startTime;
    endTime;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsISO8601)({ strict: true, strictSeparator: true }),
    (0, class_validator_1.Matches)(/T.*(?:Z|[+-]\d{2}:\d{2})$/),
    (0, class_validator_1.Validate)(IsFutureDateTimeConstraint),
    __metadata("design:type", String)
], BookingTimeSlotDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsISO8601)({ strict: true, strictSeparator: true }),
    (0, class_validator_1.Matches)(/T.*(?:Z|[+-]\d{2}:\d{2})$/),
    (0, class_validator_1.Validate)(IsAfterPropertyConstraint, ['startTime']),
    __metadata("design:type", String)
], BookingTimeSlotDto.prototype, "endTime", void 0);
class CreateBookingDto {
    nationalId;
    fullName;
    phone;
    doctorId;
    slotId;
    timeSlot;
    idempotencyKey;
    preliminaryReason;
}
exports.CreateBookingDto = CreateBookingDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{12}$/),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "nationalId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^(?:\+?84|0)(?:3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])\d{7}$/),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "doctorId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 128),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "slotId", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => BookingTimeSlotDto),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    __metadata("design:type", BookingTimeSlotDto)
], CreateBookingDto.prototype, "timeSlot", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 128),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "idempotencyKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "preliminaryReason", void 0);
