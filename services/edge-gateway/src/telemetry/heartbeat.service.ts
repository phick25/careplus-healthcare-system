import { CentralApiClient } from '../central-api.client';
import { Logger } from '../logger';
import { SpoolerService } from '../queue/spooler.service';

export interface HeartbeatConfig {
  hospitalCode: string;
  intervalMs: number;
}

export class HeartbeatService {
  private timer?: ReturnType<typeof setInterval>;
  private sending = false;

  constructor(
    private readonly config: HeartbeatConfig,
    private readonly spooler: SpoolerService,
    private readonly centralApi: CentralApiClient,
    private readonly logger: Logger,
  ) {}

  start(): void {
    if (this.timer) {
      return;
    }
    void this.send();
    this.timer = setInterval(() => void this.send(), this.config.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async send(): Promise<void> {
    if (this.sending) {
      return;
    }
    this.sending = true;
    try {
      const spoolSize = await this.spooler.size();
      await this.centralApi.postJson('/api/v1/edge/heartbeat', {
        hospitalCode: this.config.hospitalCode,
        connected: this.spooler.isCentralConnected(),
        spoolSize,
        timestamp: new Date().toISOString(),
      }, 'application/json');
      this.spooler.recordCentralConnectivity(true);
      this.logger.info('Heartbeat delivered', {
        hospitalCode: this.config.hospitalCode,
        spoolSize,
      });
    } catch (error) {
      this.spooler.recordCentralConnectivity(false);
      this.logger.warn('Heartbeat delivery failed', {
        hospitalCode: this.config.hospitalCode,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.sending = false;
    }
  }
}
