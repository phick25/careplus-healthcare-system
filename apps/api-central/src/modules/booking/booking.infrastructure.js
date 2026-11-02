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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingRedisService = exports.BookingPrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const ioredis_1 = __importDefault(require("ioredis"));
let BookingPrismaService = class BookingPrismaService extends client_1.PrismaClient {
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.BookingPrismaService = BookingPrismaService;
exports.BookingPrismaService = BookingPrismaService = __decorate([
    (0, common_1.Injectable)()
], BookingPrismaService);
let BookingRedisService = class BookingRedisService {
    client;
    constructor() {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            throw new Error('REDIS_URL must be configured');
        }
        this.client = new ioredis_1.default(redisUrl);
    }
    async onModuleDestroy() {
        await this.client.quit();
    }
};
exports.BookingRedisService = BookingRedisService;
exports.BookingRedisService = BookingRedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BookingRedisService);
