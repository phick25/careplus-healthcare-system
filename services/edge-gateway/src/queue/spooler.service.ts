import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, readdir, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { CentralApiClient } from '../central-api.client';
import { Logger } from '../logger';
import type { FhirTransactionBundle } from '../transformer/fhir.converter';

interface SpoolRecord {
  id: string;
  attempts: number;
  createdAt: string;
  bundle: FhirTransactionBundle;
}

export interface SpoolerConfig {
  directory: string;
  baseRetryMs: number;
  maxRetryMs: number;
}

export class SpoolerService {
  private flushing = false;
  private stopped = false;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private connected = false;

  constructor(
    private readonly config: SpoolerConfig,
    private readonly centralApi: CentralApiClient,
    private readonly logger: Logger,
  ) {}

  async start(): Promise<void> {
    await mkdir(this.config.directory, { recursive: true });
    this.kick();
  }

  async enqueue(bundle: FhirTransactionBundle): Promise<string> {
    if (this.stopped) {
      throw new Error('Cannot enqueue while the spooler is stopped');
    }
    const record: SpoolRecord = {
      id: `${Date.now().toString().padStart(13, '0')}-${randomUUID()}`,
      attempts: 0,
      createdAt: new Date().toISOString(),
      bundle,
    };
    await this.writeRecord(record);
    this.logger.info('FHIR bundle persisted to local spool', {
      spoolId: record.id,
      bundleId: bundle.id,
      entries: bundle.entry.length,
    });
    this.kick();
    return record.id;
  }

  async size(): Promise<number> {
    const names = await readdir(this.config.directory);
    return names.filter((name) => name.endsWith('.json')).length;
  }

  isCentralConnected(): boolean {
    return this.connected;
  }

  recordCentralConnectivity(connected: boolean): void {
    this.connected = connected;
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
    while (this.flushing) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }

  private kick(delayMs = 0): void {
    if (this.stopped || this.retryTimer) {
      return;
    }
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      void this.flush().catch((error: unknown) => {
        this.connected = false;
        this.logger.error('Spool processing failed', { error: this.errorMessage(error) });
        this.kick(this.config.baseRetryMs);
      });
    }, delayMs);
  }

  private async flush(): Promise<void> {
    if (this.flushing || this.stopped) {
      return;
    }
    this.flushing = true;
    try {
      const names = (await readdir(this.config.directory))
        .filter((name) => name.endsWith('.json'))
        .sort();
      for (const name of names) {
        if (this.stopped) {
          break;
        }
        const filePath = join(this.config.directory, name);
        const record = JSON.parse(await readFile(filePath, 'utf8')) as SpoolRecord;
        try {
          await this.centralApi.postJson('/api/v1/fhir/bundle', record.bundle);
          await unlink(filePath);
          this.connected = true;
          this.logger.info('FHIR bundle delivered to Central API', {
            spoolId: record.id,
            bundleId: record.bundle.id,
          });
        } catch (error) {
          this.connected = false;
          record.attempts += 1;
          await this.writeRecord(record);
          const delay = Math.min(
            this.config.baseRetryMs * (2 ** Math.min(record.attempts - 1, 30)),
            this.config.maxRetryMs,
          );
          this.logger.warn('Central API delivery failed; bundle retained for retry', {
            spoolId: record.id,
            attempts: record.attempts,
            retryInMs: delay,
            error: this.errorMessage(error),
          });
          this.kick(delay);
          return;
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  private async writeRecord(record: SpoolRecord): Promise<void> {
    const filePath = join(this.config.directory, `${record.id}.json`);
    const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
    const temporaryFile = await open(temporaryPath, 'wx');
    try {
      await temporaryFile.writeFile(`${JSON.stringify(record)}\n`, 'utf8');
      await temporaryFile.sync();
    } catch (error) {
      await temporaryFile.close();
      await unlink(temporaryPath).catch((cleanupError: unknown) => {
        this.logger.error('Failed to clean up temporary spool file', {
          path: temporaryPath,
          error: this.errorMessage(cleanupError),
        });
      });
      throw error;
    }
    await temporaryFile.close();
    try {
      await rename(temporaryPath, filePath);
    } catch (error) {
      await unlink(temporaryPath).catch((cleanupError: unknown) => {
        this.logger.error('Failed to clean up temporary spool file', {
          path: temporaryPath,
          error: this.errorMessage(cleanupError),
        });
      });
      throw error;
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
