import { API, Logger } from 'homebridge';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { Socket } from 'net';
import { join } from 'path';
import { URLSearchParams } from 'url';

import { HSBConfig } from './config';
import { HSBShortcutStatus } from './shortcut';
import { HSBUtils } from './utils';

export class HSBXCallbackUrlServer {
  private readonly pathname = '/x-callback-url';
  private readonly proto = 'http';
  private readonly sockets: Set<Socket> = new Set();
  private readonly tokens: Set<string> = new Set();

  private readonly hostname: string;
  private readonly port: number;
  private readonly server: Server;

  constructor(
    private readonly config: HSBConfig,
    private readonly log: Logger,
    private readonly utils: HSBUtils,
    private readonly api: API,
  ) {
    this.hostname = config.shortcutResultCallback.callbackServerHostname;
    this.port = config.shortcutResultCallback.callbackServerPort;

    this.server = this.create();

    api.on('shutdown', this.destroy);
  }

  public get baseUrl(): string {
    return `${this.proto}://${this.hostname}:${this.port}${this.pathname}`;
  }

  public issueToken(): string {
    const token = this.api.hap.uuid.generate(Date.now().toString());
    this.tokens.add(token);
    return token;
  }

  private isValidToken(token?: string): boolean {
    return typeof token === 'string' && this.tokens.delete(token);
  }

  private create(): Server {
    if (this.config.waitForShortcutResult !== true) {
      throw new Error('Server::create Attemped to create server when waitForShortcutResult is off');
    }

    const server = createServer(this.requestListener);

    server.listen(this.port, this.hostname, () => {
      this.log.info(`X-Callback-Url Server listening at ${this.hostname}:${this.port}`);
    });

    server.on('error', (error) => {
      this.log.error(`${error}`);
    });

    server.on('connection', (socket) => {
      this.sockets.add(socket);

      server.once('close', () => {
        this.sockets.delete(socket);
      });
    });

    return server;
  }

  private destroy(): void {
    if (typeof this.sockets?.size === 'number') {
      for (const socket of this.sockets) {
        socket.destroy();
        this.sockets.delete(socket);
      }
    }

    if (typeof this.server?.close === 'function') {
      this.server.close((error) => {
        if (error instanceof Error) {
          throw error;
        }
      });
    }

    this.log.info('X-Callback-Url Server destroyed');
  }

  private requestListener = async (
    { headers, method, url }: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> => {
    this.log.debug('Server::requestListener', 'Incoming request, starting validation');

    if (typeof url !== 'string' || method !== 'GET') {
      return this.endWithError(res, 405, 'Unsupported request', `${method}:${url}`);
    }

    const { pathname, searchParams } = new URL(url, `${this.proto}://${headers.host}`);

    if (pathname !== this.pathname) {
      return this.endWithError(res, 404, 'Invalid url pathname', pathname);
    }

    const { areValidRequiredParamsValues: areRequiredParamsValuesValid, ...parsedSearchParams } =
      new HSBXCallbackUrlParsedSearchParams(searchParams, this.utils);

    if (!areRequiredParamsValuesValid()) {
      return this.endWithError(res, 400, 'Missing required search param(s)', parsedSearchParams);
    }

    if (!this.isValidToken(parsedSearchParams.token)) {
      return this.endWithError(res, 401, 'Authorization token invalid or expired');
    }

    try {
      await this.runCallbackScript(parsedSearchParams);
    } catch (e) {
      return this.endWithError(res, 500, 'Failed to run callback script', e);
    }

    this.log.info(
      'Server::requestListener',
      `Executed callback script for shortcut ${parsedSearchParams.shortcut}`,
    );
    res.writeHead(200).end();
  };

  private endWithError(
    res: ServerResponse,
    statusCode: number,
    errorMessage: string,
    errorPayload?: unknown,
  ): void {
    this.log.error(
      'Server::requestListener',
      `StatusCode=${statusCode}`,
      errorMessage,
      errorPayload,
    );
    res.writeHead(statusCode).end();
    return;
  }

  private async runCallbackScript(
    searchParams: HSBXCallbackUrlParsedSearchParamsType,
  ): Promise<void> {
    let script = this.config.shortcutResultCallback.callbackCustomCommand;

    if (!this.utils.isNonEmptyString(script)) {
      script = this.getDefaultCallbackScript(searchParams);
    }

    await this.utils.execAsync(script, {
      env: {
        SHORTCUT_NAME: searchParams.shortcut,
        SHORTCUT_RESULT: searchParams.status,
      },
      timeout: 10000,
    });
  }

  private getDefaultCallbackScript(searchParams: HSBXCallbackUrlParsedSearchParamsType): string {
    let subtitle: string;
    let sound: string;
    switch (searchParams.status) {
      case HSBShortcutStatus.SUCCESS:
        subtitle = 'was executed successfully.';
        searchParams.result && (subtitle += ` Result:\n${searchParams.result}`);
        sound = 'Glass';
        break;
      case HSBShortcutStatus.ERROR:
        subtitle = 'execution failed.';
        searchParams.errorMessage && (subtitle += ` Error:\n${searchParams.errorMessage}`);
        sound = 'Sosumi';
        break;
      case HSBShortcutStatus.CANCEL:
        subtitle = 'execution was cancelled';
        sound = 'Sosumi';
        break;
      default:
        subtitle = 'received an unknown result status';
        sound = 'Sosumi';
        break;
    }

    return (
      `open ${join(__dirname, './bin/defaultCallbackScript.app')} ` +
      `--env TITLE="${this.config.name}" ` +
      `--env SUBTITLE="${searchParams.shortcut} ${subtitle}" ` +
      `--env SOUND="${sound}" ` +
      `--env TOKEN="${searchParams.token}"`
    );
  }
}

enum HSBXCallbackUrlRequiredSearchParamsKeys {
  SHORTCUT = 'shortcut',
  STATUS = 'status',
  TOKEN = 'token',
}

enum HSBXCallbackUrlOptionalSearchParamsKeys {
  ERROR_MESSAGE = 'errorMessage',
  RESULT = 'result',
}

const requiredParamsKeysList = Object.values(HSBXCallbackUrlRequiredSearchParamsKeys);
const optionalParamsKeysList = Object.values(HSBXCallbackUrlOptionalSearchParamsKeys);

type HSBXCallbackUrlParsedSearchParamsType = {
  [K in HSBXCallbackUrlRequiredSearchParamsKeys]: string;
} & {
  [K in HSBXCallbackUrlOptionalSearchParamsKeys]: string | undefined;
};

class HSBXCallbackUrlParsedSearchParams implements HSBXCallbackUrlParsedSearchParamsType {
  public readonly shortcut!: string;
  public readonly status!: string;
  public readonly token!: string;
  public readonly result: string | undefined;
  public readonly errorMessage: string | undefined;

  constructor(
    searchParams: URLSearchParams,
    private readonly utils: HSBUtils,
  ) {
    for (const key of requiredParamsKeysList) {
      this[key] = searchParams.get(key) || '';
    }
    for (const key of optionalParamsKeysList) {
      const value = searchParams.get(key);
      this[key] = utils.isNonEmptyString(value) ? value : undefined;
    }
  }

  public areValidRequiredParamsValues = (): boolean => {
    return requiredParamsKeysList.every((key) => this.utils.isNonEmptyString(this[key]));
  };
}
