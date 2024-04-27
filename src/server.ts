import { API, Logger } from 'homebridge';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { Socket } from 'net';
import { join } from 'path';
import { URLSearchParams } from 'url';

import { HSBConfig } from './config';
import { PLATFORM_NAME } from './settings';
import { HSBShortcutStatus } from './shortcut';
import { HSBUtils } from './utils';

export class HSBXCallbackUrlServer {
  private readonly pathname = '/x-callback-url';
  private readonly sockets: Set<Socket> = new Set();
  private readonly tokens: Set<string> = new Set();

  private readonly proto: HSBConfig['callbackServerProtocol'];
  private readonly hostname: string;
  private readonly port: number;
  private readonly server: Server;

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
    if (this.config.callbackServerEnabled !== true) {
      throw new Error('Server::create Attemped to create server when waitForShortcutResult is off');
    }

    const server = createServer(this.requestListener);

    server.listen(this.port, this.hostname, () => {
      this.log.info(`XCallbackUrlServer listening at ${this.hostname}:${this.port}`);
    });

    server.on('error', (error) => {
      this.log.error('XCallbackUrlServer::on(error)', error);
    });

    server.on('connection', (socket) => {
      this.sockets.add(socket);

      server.once('close', () => {
        this.sockets.delete(socket);
      });
    });

    return server;
  }

  private destroy = (): void => {
    this.log.debug('XCallbackUrlServer::destroy', `Destroying ${this.sockets.size} sockets`);

    for (const socket of this.sockets) {
      socket.destroy();
      this.sockets.delete(socket);
    }

    this.log.debug('XCallbackUrlServer::destroy', 'Emitting server close event');

    this.server.close((error) => {
      if (error instanceof Error) {
        throw error;
      }
    });

    this.log.info('XCallbackUrlServer destroyed');
  };

  private requestListener = async (
    { headers, method, url }: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> => {
    this.log.debug('XCallbackUrlServer::requestListener', 'Incoming request, starting validation');

    const { pathname, searchParams: URLSearchParams } = new URL(
      url || '',
      `${this.proto}://${headers.host}`,
    );

    const { areValidRequiredParamsValues, ...searchParams } = new HSBXCallbackUrlSearchParams(
      URLSearchParams,
      this.utils,
    );

    const requestValidators = this.createRequestValidators({
      isSupported: {
        condition: () => typeof url === 'string' || method === 'GET',
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
        errorMessage: `Missing required search params: ${searchParams}`,
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
      await this.runCallbackCommand(searchParams);
    } catch (e) {
      return this.endWithError(res, 500, 'Failed to run callback command', e);
    }

    this.log.success(
      'XCallbackUrlServer::requestListener',
      `Executed callback command for shortcut ${searchParams.shortcut}`,
    );

    return this.endWithStatusAndHtml(res, 200);
  };

  private createRequestValidators(
    validatorsMap: HSBXCallbackUrlRequestValidatorsMap,
  ): HSBXCallbackUrlRequestValidator[] {
    return Object.values(validatorsMap).map(
      ({ condition, errorCode, errorMessage }) =>
        new HSBXCallbackUrlRequestValidator(condition, errorCode, errorMessage),
    );
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

  private async runCallbackCommand(searchParams: HSBXCallbackUrlSearchParamsType): Promise<void> {
    let command = this.config.callbackCustomCommand;

    if (!this.utils.isNonEmptyString(command)) {
      command = this.getDefaultCallbackCommand(searchParams);
    }

    await this.utils.execAsync(command, {
      env: {
        SHORTCUT_NAME: searchParams.shortcut,
        SHORTCUT_STATUS: searchParams.status,
        SHORTCUT_RESULT: searchParams.result,
        SHORTCUT_ERROR: searchParams.errorMessage,
      },
      timeout: this.config.callbackCommandTimeout,
    });
  }

  private getDefaultCallbackCommand(searchParams: HSBXCallbackUrlSearchParamsType): string {
    let subtitle: string;
    let sound: string;
    switch (searchParams.status) {
      case HSBShortcutStatus.SUCCESS:
        subtitle = 'executed successfully';
        searchParams.result && (subtitle += `\nResult: ${searchParams.result}`);
        sound = 'Glass';
        break;
      case HSBShortcutStatus.ERROR:
        subtitle = 'execution failed';
        searchParams.errorMessage && (subtitle += `\nError: ${searchParams.errorMessage}`);
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
      `open ${this.defaultCallbackCommandAppPath} ` +
      `--env NOTIFICATION_TITLE="${this.config.name}" ` +
      `--env NOTIFICATION_SUBTITLE="${searchParams.shortcut} ${subtitle}" ` +
      `--env NOTIFICATION_SOUND="${sound}"`
    );
  }

  private readonly defaultCallbackCommandAppPath = join(
    __dirname,
    './bin/HomebridgeShortcutsButtons\\ -\\ Notify\\ Shortcut\\ Result.app',
  );
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

type HSBXCallbackUrlSearchParamsType = {
  [K in HSBXCallbackUrlRequiredSearchParamsKeys]: string;
} & {
  [K in HSBXCallbackUrlOptionalSearchParamsKeys]: string | undefined;
};

class HSBXCallbackUrlSearchParams implements HSBXCallbackUrlSearchParamsType {
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

interface HSBXCallbackUrlRequestValidatorMembersBase {
  errorCode: number;
  errorMessage: string;
}

class HSBXCallbackUrlRequestValidator implements HSBXCallbackUrlRequestValidatorMembersBase {
  constructor(
    private readonly condition: () => boolean,
    public readonly errorCode: number,
    public readonly errorMessage: string,
  ) {}

  public get passed(): boolean {
    try {
      return this.condition() === true;
    } catch (e) {
      return false;
    }
  }
}

type HSBXCallbackUrlRequestValidatorsMap = {
  [K: string]: HSBXCallbackUrlRequestValidatorMembersBase & {
    condition: HSBXCallbackUrlRequestValidator['condition'];
  };
};

const CALLBACK_HTML_CONTENT = `<!DOCTYPE html>
<html class="default" lang="en">
  <head>
    <meta charSet="utf-8">
    <title>${PLATFORM_NAME} - X-Callback-Url Server</title>
    <script>typeof window !== "undefined" && window.close()</script>
  </head>
</html>`;
