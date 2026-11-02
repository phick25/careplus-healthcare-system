import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class BookingPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

@Injectable()
export class BookingRedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL must be configured');
    }

    this.client = new Redis(redisUrl);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
