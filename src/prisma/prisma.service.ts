import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor() {
    // 1. Create the pg Pool
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // 2. Initialize the adapter with the pool
    const adapter = new PrismaPg(pool);

    // 3. Pass the adapter to the PrismaClient constructor
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    // Explicitly connect on startup to catch config errors early
    await this.$connect();
  }

  async onModuleDestroy() {
    // Disconnect Prisma
    await this.$disconnect();
    // Also shut down the pool to prevent hanging processes
    await this.pool.end();
  }
}