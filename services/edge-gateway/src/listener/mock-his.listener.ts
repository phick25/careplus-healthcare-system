import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { createServer as createNetServer, type Server as NetServer, type Socket } from 'node:net';
import { Logger } from '../logger';
import { SpoolerService } from '../queue/spooler.service';
import { FhirConverter, type FhirTransactionBundle } from '../transformer/fhir.converter';

const MAX_BODY_BYTES = 1024 * 1024;
const MLLP_START = 0x0b;
const MLLP_END = 0x1c;
const MLLP_CARRIAGE_RETURN = 0x0d;

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export interface ListenerConfig {
  host: string;
  port: number;
  mllpPort?: number;
  hospitalCode: string;
}

export class MockHisListener {
  private server?: Server;
  private mllpServer?: NetServer;
  private readonly mllpSockets = new Set<Socket>();

  constructor(
    private readonly config: ListenerConfig,
    private readonly converter: FhirConverter,
    private readonly spooler: SpoolerService,
    private readonly logger: Logger,
  ) {}

  async start(): Promise<void> {
    if (this.server) {
      return;
    }
    const server = createServer((request, response) => {
      void this.handle(request, response).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        const status = error instanceof HttpError ? error.status : 500;
        if (status >= 500) {
          this.logger.error('HIS/LIS request processing failed', { status, error: message });
          this.respond(response, status, { error: 'Gateway could not persist the message' });
        } else {
          this.logger.warn('HIS/LIS request rejected', { status, error: message });
          this.respond(response, status, { error: message });
        }
      });
    });
    this.server = server;
    server.on('error', (error) => {
      this.logger.error('HTTP listener error', { error: error.message });
    });

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(this.config.port, this.config.host, () => {
        server.removeListener('error', reject);
        resolve();
      });
    });

    if (this.config.mllpPort) {
      try {
        await this.startMllpListener();
      } catch (error) {
        this.server = undefined;
        await new Promise<void>((resolve) => server.close(() => resolve()));
        throw error;
      }
    }

    this.logger.info('HIS/LIS listener started', {
      host: this.config.host,
      port: this.config.port,
      endpoint: 'POST /edge/sync-trigger',
      ...(this.config.mllpPort ? { mllpPort: this.config.mllpPort } : {}),
    });
  }

  async stop(): Promise<void> {
    const server = this.server;
    const mllpServer = this.mllpServer;
    this.server = undefined;
    this.mllpServer = undefined;
    for (const socket of this.mllpSockets) {
      socket.destroy();
    }
    const closeTasks: Promise<void>[] = [];
    if (server) {
      closeTasks.push(new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      }));
    }
    if (mllpServer) {
      closeTasks.push(new Promise<void>((resolve, reject) => {
        mllpServer.close((error) => error ? reject(error) : resolve());
      }));
    }
    await Promise.all(closeTasks);
  }

  private async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    if (request.method === 'GET' && pathname === '/health') {
      this.respond(response, 200, { status: 'ok' });
      return;
    }
    if (request.method !== 'POST' || pathname !== '/edge/sync-trigger') {
      this.respond(response, 404, { error: 'Not found' });
      return;
    }

    const rawBody = await this.readBody(request);
    const rawMessage = this.extractMessage(rawBody, request.headers['content-type'] ?? '');
    const { bundle, spoolId } = await this.ingest(rawMessage);
    this.respond(response, 202, {
      accepted: true,
      spoolId,
      bundleId: bundle.id,
      resourceCount: bundle.entry.length,
    });
  }

  private async startMllpListener(): Promise<void> {
    const server = createNetServer((socket) => {
      this.mllpSockets.add(socket);
      socket.once('close', () => this.mllpSockets.delete(socket));
      let buffer = Buffer.alloc(0);
      let processing = Promise.resolve();

      socket.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        socket.pause();
        processing = processing.then(async () => {
          while (buffer.length > 0) {
            if (buffer[0] !== MLLP_START) {
              throw new Error('MLLP frame does not start with VT');
            }
            const end = buffer.indexOf(MLLP_END, 1);
            if (end < 0) {
              if (buffer.length > MAX_BODY_BYTES + 2) {
                throw new Error('MLLP frame exceeds the 1 MiB limit');
              }
              break;
            }
            if (end > MAX_BODY_BYTES) {
              throw new Error('MLLP frame exceeds the 1 MiB limit');
            }
            if (buffer.length < end + 2) {
              break;
            }
            if (buffer[end + 1] !== MLLP_CARRIAGE_RETURN) {
              throw new Error('MLLP frame is missing the trailing CR');
            }

            const message = buffer.subarray(1, end).toString('utf8');
            buffer = buffer.subarray(end + 2);
            const acknowledgment = await this.handleMllpMessage(message);
            socket.write(acknowledgment);
          }
        }).catch((error: unknown) => {
          this.logger.warn('MLLP connection rejected', {
            error: error instanceof Error ? error.message : String(error),
          });
          socket.destroy();
        }).finally(() => {
          if (!socket.destroyed) {
            socket.resume();
          }
        });
      });
      socket.on('error', (error) => {
        this.logger.warn('MLLP socket error', { error: error.message });
      });
    });
    this.mllpServer = server;
    server.on('error', (error) => {
      this.logger.error('MLLP listener error', { error: error.message });
    });
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(this.config.mllpPort, this.config.host, () => {
        server.removeListener('error', reject);
        resolve();
      });
    });
  }

  private async handleMllpMessage(message: string): Promise<Buffer> {
    const msh = message.split(/\r|\n/, 1)[0] ?? '';
    const separator = msh[3] || '|';
    const fields = msh.split(separator);
    const messageType = fields[8] ?? 'UNKNOWN';
    const controlId = fields[9] ?? '';
    const senderApplication = fields[2] || 'HIS';
    const senderFacility = fields[3] || 'HOSPITAL';
    const ackMessageType = `ACK${messageType.includes('^') ? `^${messageType.split('^').slice(1).join('^')}` : ''}`;
    let acknowledgmentCode = 'AA';
    let errorText = '';

    try {
      await this.ingest(message);
    } catch (error) {
      acknowledgmentCode = 'AE';
      errorText = error instanceof Error ? error.message.replace(/[\r\n|]/g, ' ') : 'Message rejected';
      this.logger.warn('MLLP message was not accepted', {
        messageType,
        controlId,
        error: errorText,
      });
    }

    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const ack = [
      ['MSH', fields[1] || '^~\\&', 'EDGE', this.config.hospitalCode, senderApplication, senderFacility, timestamp, '', ackMessageType, controlId, 'P', '2.5'].join(separator),
      ['MSA', acknowledgmentCode, controlId, ...(errorText ? [errorText] : [])].join(separator),
    ].join('\r') + '\r';
    return Buffer.concat([Buffer.from([MLLP_START]), Buffer.from(ack, 'utf8'), Buffer.from([MLLP_END, MLLP_CARRIAGE_RETURN])]);
  }

  private async ingest(rawMessage: string): Promise<{ bundle: FhirTransactionBundle; spoolId: string }> {
    let bundle: FhirTransactionBundle;
    try {
      bundle = this.converter.convert(rawMessage);
    } catch (error) {
      throw new HttpError(400, error instanceof Error ? error.message : 'Invalid HL7 message');
    }
    const spoolId = await this.spooler.enqueue(bundle);
    return { bundle, spoolId };
  }

  private async readBody(request: IncomingMessage): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let totalBytes = 0;
      request.on('data', (chunk: Buffer | string) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalBytes += buffer.byteLength;
        if (totalBytes > MAX_BODY_BYTES) {
          reject(new HttpError(413, 'Request body exceeds the 1 MiB limit'));
          request.resume();
          return;
        }
        chunks.push(buffer);
      });
      request.once('end', () => resolve(Buffer.concat(chunks)));
      request.once('error', reject);
    });
  }

  private extractMessage(body: Buffer, contentType: string): string {
    const text = body.toString('utf8').trim();
    if (contentType.toLowerCase().includes('application/json')) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new HttpError(400, 'Request body contains invalid JSON');
      }
      if (!parsed || typeof parsed !== 'object' || !('hl7' in parsed) ||
        typeof parsed.hl7 !== 'string' || parsed.hl7.trim().length === 0) {
        throw new HttpError(400, 'JSON request must contain a non-empty string property named "hl7"');
      }
      return parsed.hl7;
    }
    if (!text) {
      throw new HttpError(400, 'Request body must contain an HL7 message');
    }
    return text;
  }

  private respond(response: ServerResponse, status: number, body: Record<string, unknown>): void {
    if (response.headersSent || response.destroyed) {
      return;
    }
    const payload = JSON.stringify(body);
    response.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': Buffer.byteLength(payload),
    });
    response.end(payload);
  }
}
