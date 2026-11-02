import { CentralApiClient } from './central-api.client';
import { Logger } from './logger';
import { MockHisListener } from './listener/mock-his.listener';
import { SpoolerService } from './queue/spooler.service';
import { HeartbeatService } from './telemetry/heartbeat.service';
import { FhirConverter } from './transformer/fhir.converter';

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function portNumber(name: string, fallback: number, allowDisabled = false): number {
  const value = process.env[name];
  const parsed = value ? Number(value) : fallback;
  const minimum = allowDisabled ? 0 : 1;
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > 65_535) {
    throw new Error(`${name} must be a TCP port from ${minimum} to 65535`);
  }
  return parsed;
}

async function main(): Promise<void> {
  const centralApi = new CentralApiClient({
    baseUrl: requiredEnvironment('CENTRAL_API_URL'),
    clientCertPath: process.env.CLIENT_CERT_PATH || undefined,
    clientKeyPath: process.env.CLIENT_KEY_PATH || undefined,
    timeoutMs: positiveInteger('CENTRAL_API_TIMEOUT_MS', 10_000),
  });
  const logger = new Logger(process.env.LOG_FILE || './data/gateway.log');
  const spooler = new SpoolerService({
    directory: process.env.SPOOL_DIR || './data/spool',
    baseRetryMs: positiveInteger('RETRY_BASE_MS', 1_000),
    maxRetryMs: positiveInteger('RETRY_MAX_MS', 60_000),
  }, centralApi, logger);
  const hospitalCode = requiredEnvironment('HOSPITAL_CODE');
  const heartbeat = new HeartbeatService({
    hospitalCode,
    intervalMs: positiveInteger('HEARTBEAT_INTERVAL_MS', 30_000),
  }, spooler, centralApi, logger);
  const listener = new MockHisListener({
    host: process.env.HOST || '0.0.0.0',
    port: portNumber('PORT', 8080),
    mllpPort: portNumber('MLLP_PORT', 2575, true),
    hospitalCode,
  }, new FhirConverter(), spooler, logger);

  await spooler.start();
  await listener.start();
  heartbeat.start();

  let stopping = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (stopping) {
      return;
    }
    stopping = true;
    logger.info('Shutting down Edge Gateway', { signal });
    heartbeat.stop();
    await listener.stop();
    await spooler.stop();
  };

  process.once('SIGINT', () => void shutdown('SIGINT').catch((error: unknown) => {
    logger.error('Shutdown failed', { error: error instanceof Error ? error.message : String(error) });
    process.exitCode = 1;
  }));
  process.once('SIGTERM', () => void shutdown('SIGTERM').catch((error: unknown) => {
    logger.error('Shutdown failed', { error: error instanceof Error ? error.message : String(error) });
    process.exitCode = 1;
  }));
}

void main().catch((error: unknown) => {
  console.error('Edge Gateway startup failed:', error);
  process.exitCode = 1;
});
