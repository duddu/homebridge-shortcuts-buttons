import { API, Logger } from 'homebridge';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';

import { HSBXCallbackUrlServerCommand } from './command';
import { HSBConfig } from '../config';
import { HSBXCallbackUrlSearchParams } from './params';
import { PLATFORM_NAME } from '../settings';
import { HSBUtils } from '../utils';
import { createRequestValidators } from './validators';

export class HSBXCallbackUrlServer {
  private readonly pathname = '/x-callback-url';
  private readonly tokens: Set<string> = new Set();

  private readonly proto: HSBConfig['callbackServerProtocol'];
  private readonly hostname: string;
  private readonly port: number;
  private readonly server: Server | null;

  constructor(
    private readonly config: HSBConfig,
    private readonly log: Logger,
    private readonly utils: HSBUtils,
    private readonly api: API,
  ) {
    this.proto = config.callbackServerProtocol;
    this.hostname = config.callbackServerHostname;
    this.port = config.callbackServerPort;

    this.server = this.create();

    api.on('shutdown', () => this.destroy());
  }

  public get baseUrl(): string {
    return `${this.proto}://${this.hostname}:${this.port}${this.pathname}`;
  }

  public issueToken(): string {
    const token = this.api.hap.uuid.generate(
      `${HSBXCallbackUrlServer.name}_${Date.now().toString()}`,
    );
    this.tokens.add(token);
    return token;
  }

  private isValidToken(token?: string): boolean {
    return typeof token === 'string' && this.tokens.delete(token);
  }

  private create(): Server | null {
    if (this.config.callbackServerEnabled !== true) {
      this.log.error('Server::create Attemped to create server when waitForShortcutResult is off');
      return null;
    }

    const server = createServer({ requestTimeout: 30000 });

    server.listen(this.port, this.hostname, () => {
      this.log.info(`XCallbackUrlServer listening at ${this.hostname}:${this.port}`);
    });

    server.on('request', this.requestListener.bind(this));

    server.on('error', (error) => {
      this.log.error('XCallbackUrlServer::on(error)', error);
    });

    return server;
  }

  private destroy(): void {
    this.log.debug('XCallbackUrlServer::destroy', 'Closing all server connection');

    this.server?.closeAllConnections();
    this.server?.removeAllListeners();
  }

  private async requestListener(
    { headers, method, url }: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    this.log.debug('XCallbackUrlServer::requestListener', 'Incoming request, starting validation');

    const { pathname, searchParams: URLSearchParams } = new URL(
      url || '',
      `${this.proto}://${headers.host}`,
    );

    const { areValidRequiredParamsValues, ...searchParams } = new HSBXCallbackUrlSearchParams(
      URLSearchParams,
      this.utils,
    );

    const requestValidators = createRequestValidators({
      isSupported: {
        condition: () => typeof url === 'string' && method === 'GET',
        errorMessage: `Unsupported request: ${method}:${url}`,
        errorCode: 405,
      },
      hasValidPathname: {
        condition: () => pathname === this.pathname,
        errorMessage: `Invalid url pathname: ${pathname}`,
        errorCode: 404,
      },
      hasValidSearchParams: {
        condition: () => areValidRequiredParamsValues(),
        errorMessage: `Missing required search params: ${JSON.stringify(searchParams)}`,
        errorCode: 400,
      },
      hasValidAuthToken: {
        condition: () => this.isValidToken(searchParams.token),
        errorMessage: 'Authorization token invalid or already consumed',
        errorCode: 403,
      },
    });

    for (const validator of requestValidators) {
      if (!validator.passed) {
        return this.endWithError(res, validator.errorCode, validator.errorMessage);
      }
    }

    this.log.debug('XCallbackUrlServer::requestListener Request validators passed');

    try {
      const command = new HSBXCallbackUrlServerCommand(this.log, this.config, this.utils);
      await command.run(searchParams);
    } catch (e) {
      return this.endWithError(res, 500, 'Failed to run callback command', e);
    }

    this.log.success(
      'XCallbackUrlServer::requestListener',
      `Executed callback command for shortcut ${searchParams.shortcut}`,
    );

    return this.endWithStatusAndHtml(res, 200);
  }

  private endWithError(
    res: ServerResponse,
    statusCode: number,
    errorMessage: string,
    errorPayload?: unknown,
  ): void {
    this.log.error(
      `XCallbackUrlServer::requestListener StatusCode=${statusCode}`,
      errorMessage,
      errorPayload,
    );
    this.endWithStatusAndHtml(res, statusCode);
  }

  private endWithStatusAndHtml(res: ServerResponse, statusCode: number): void {
    res.writeHead(statusCode);
    res.write(CALLBACK_HTML_CONTENT);
    res.end();
  }
}

const CALLBACK_HTML_CONTENT = `<!DOCTYPE html>
<html class="default" lang="en">
  <head>
    <meta charSet="utf-8">
    <title>${PLATFORM_NAME} - X-Callback-Url Server</title>
    <script>typeof window !== "undefined" && window.close()</script>
  </head>
</html>`;
