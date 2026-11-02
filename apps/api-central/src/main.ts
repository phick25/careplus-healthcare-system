import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(Number(process.env.PORT ?? 3001));
}

void bootstrap().catch((error: unknown) => {
  const detail = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`API startup failed: ${detail}\n`);
  process.exitCode = 1;
});
