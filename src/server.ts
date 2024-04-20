import { API, Logger } from 'homebridge';
import { createServer, IncomingMessage, RequestListener, Server, ServerResponse } from 'http';
import { Socket } from 'net';
import { execSync } from 'child_process';
import { URLSearchParams } from 'url';

import { ShortcutsButtonsPlatform } from './platform';
import { ShortcutsButtonsPlatformAccessory } from './accessory';
import { ShortcutStatus } from './shortcut';
import { join } from 'path';

export class XCallbackUrlServer {
  private static readonly hostname: string = '127.0.0.1'; // TODO: get from config
  private static readonly port: number = 9090;
  private static readonly pathname: string = '/x-callback-url';
  public static readonly baseUrl = `http://${this.hostname}:${this.port}${this.pathname}`;

  private readonly server: Server;
  private readonly sockets: Set<Socket> = new Set();
  private readonly requiredParamsKeys = ['service', 'shortcutName', 'status'] as const;

  constructor(
    private readonly log: Logger,
    private readonly config: ShortcutsButtonsPlatform['config'],
    private readonly api: API,
    private readonly accessory: ShortcutsButtonsPlatformAccessory | null,
  ) {
    this.server = this.create();

    api.on('shutdown', this.destroy);
  }

  private create(): Server {
    const server = createServer(this.reqListener);

    server.listen(XCallbackUrlServer.port, XCallbackUrlServer.hostname);

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
    if (typeof this.sockets?.has !== 'undefined') {
      for (const socket of this.sockets) {
        socket.destroy();
        this.sockets.delete(socket);
      }
    }

    this.server.close((error) => {
      if (error instanceof Error) {
        throw error;
      }
    });
  }

  private reqListener: RequestListener<typeof IncomingMessage, typeof ServerResponse> = (
    { headers, method, url },
    res,
  ): void => {
    if (typeof url !== 'string' || method !== 'GET') {
      this.log.error('Unsupported http request', headers);
      res.writeHead(404).end();
      return;
    }

    const { pathname, searchParams } = new URL(url, `http://${headers.host}`);

    if (pathname !== XCallbackUrlServer.pathname) {
      this.log.error('Invalid url pathname', url);
      res.writeHead(404).end();
      return;
    }

    let requiredParamsMap: ReturnType<typeof this.getValidatedRequiredParams>;
    try {
      requiredParamsMap = this.getValidatedRequiredParams(searchParams);
    } catch (key) {
      this.log.error(`Missing required query parameter "${key}"`);
      res.writeHead(400).end();
      return;
    }

    if (
      !this.isValidServiceUUID(
        requiredParamsMap.get('shortcutName'),
        requiredParamsMap.get('service'),
      )
    ) {
      this.log.error(
        `Invalid service identifier: ${requiredParamsMap.get('shortcutName')}` +
          `(${requiredParamsMap.get('service')})`,
      );
      res.writeHead(400).end();
      return;
    }

    const defaultScript = this.getDefaultCallbackScript(requiredParamsMap, searchParams);

    execSync(defaultScript, {
      stdio: 'inherit',
      env: {
        SHORTCUT_NAME: requiredParamsMap.get('shortcutName'),
        SHORTCUT_RESULT: requiredParamsMap.get('status'),
      },
      shell: 'bash',
    });

    this.log.info(`Executed callback script for url ${url}`);
    res.writeHead(200).end();
  };

  private getValidatedRequiredParams(
    searchParams: URLSearchParams,
  ): Map<(typeof this.requiredParamsKeys)[number], string> {
    const requiredParamsEntries: [(typeof this.requiredParamsKeys)[number], string][] =
      this.requiredParamsKeys.map((key) => [key, searchParams.get(key) as string]);
    for (const [key, value] of requiredParamsEntries) {
      if (typeof value !== 'string' || value === '') {
        throw key;
      }
    }
    return new Map(requiredParamsEntries);
  }

  private isValidServiceUUID(shortcutName?: string, serviceUUID?: string): boolean {
    if (!this.accessory || !shortcutName || !serviceUUID) {
      return false;
    }

    const serviceConfig = this.config.buttons.find((button) => button.shortcut === shortcutName);

    return (
      this.accessory.services.findIndex(
        (service) => service.UUID === serviceUUID && service.displayName === serviceConfig?.name,
      ) !== -1
    );
  }

  private getDefaultCallbackScript(
    requiredParamsMap: ReturnType<typeof this.getValidatedRequiredParams>,
    searchParams: URLSearchParams,
  ): string {
    let subtitle: string;
    let sound: string;
    switch (requiredParamsMap.get('status')) {
      case ShortcutStatus.SUCCESS:
        subtitle = `was executed successfully. Result:\n${searchParams.get('result')}`;
        sound = 'Glass';
        break;
      case ShortcutStatus.ERROR:
        subtitle = `execution failed. Error:\n${searchParams.get('errorMessage')}`;
        sound = 'Sosumi';
        break;
      case ShortcutStatus.CANCEL:
        subtitle = 'execution was cancelled';
        sound = 'Sosumi';
        break;
      default:
        subtitle = 'received an unknown result status';
        sound = 'Sosumi';
        break;
    }

    return (
      `open ${join(__dirname, 'bin/defaultCallbackScript.app')} ` +
      `--env TITLE="${this.config.name}" ` +
      `--env SUBTITLE="${requiredParamsMap.get('shortcutName')} ${subtitle}" ` +
      `--env SOUND="${sound}" ` +
      `--env PATHNAME="${XCallbackUrlServer.pathname}"`
    );
  }
}
