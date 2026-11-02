import { readFileSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest, type RequestOptions } from 'node:https';

export interface CentralApiConfig {
  baseUrl: string;
  clientCertPath?: string;
  clientKeyPath?: string;
  timeoutMs: number;
}

export class CentralApiClient {
  private readonly baseUrl: URL;
  private readonly certificate?: Buffer;
  private readonly privateKey?: Buffer;
  private readonly timeoutMs: number;

  constructor(config: CentralApiConfig) {
    this.baseUrl = new URL(config.baseUrl);
    if (!['http:', 'https:'].includes(this.baseUrl.protocol)) {
      throw new Error('CENTRAL_API_URL must use HTTP or HTTPS');
    }
    this.timeoutMs = config.timeoutMs;

    if (config.clientCertPath) {
      if (this.baseUrl.protocol !== 'https:') {
        throw new Error('CLIENT_CERT_PATH requires an HTTPS CENTRAL_API_URL');
      }
      this.certificate = readFileSync(config.clientCertPath);
      this.privateKey = readFileSync(config.clientKeyPath || config.clientCertPath);
    } else if (config.clientKeyPath) {
      throw new Error('CLIENT_KEY_PATH requires CLIENT_CERT_PATH');
    }
  }

  async postJson(path: string, body: unknown, contentType = 'application/fhir+json'): Promise<void> {
    const url = new URL(path, this.baseUrl);
    const payload = Buffer.from(JSON.stringify(body));
    const isHttps = url.protocol === 'https:';

    await new Promise<void>((resolve, reject) => {
      const options: RequestOptions = {
        method: 'POST',
        headers: {
          'content-type': contentType,
          'content-length': payload.byteLength,
        },
        timeout: this.timeoutMs,
        ...(isHttps && this.certificate
          ? { cert: this.certificate, key: this.privateKey }
          : {}),
      };
      const request = (isHttps ? httpsRequest : httpRequest)(url, options, (response) => {
        response.resume();
        response.once('end', () => {
          const status = response.statusCode ?? 0;
          if (status >= 200 && status < 300) {
            resolve();
          } else {
            reject(new Error(`Central API returned HTTP ${status} for ${url.pathname}`));
          }
        });
      });

      request.setTimeout(this.timeoutMs, () => {
        request.destroy(new Error(`Central API request timed out after ${this.timeoutMs}ms`));
      });
      request.once('error', reject);
      request.end(payload);
    });
  }
}
