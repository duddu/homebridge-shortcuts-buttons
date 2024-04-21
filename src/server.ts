import { API, Logger, Nullable } from 'homebridge';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { Socket } from 'net';
import { URLSearchParams } from 'url';

import { ShortcutsButtonsPlatformConfig } from './platform';
import { ShortcutsButtonsPlatformAccessory } from './accessory';
import { ShortcutStatus } from './shortcut';
import { join } from 'path';
import { ShortcutsButtonsUtils } from './utils';

export class XCallbackUrlServer {
  private readonly proto = 'http';
  private readonly hostname: string;
  private readonly port: number;
  private readonly pathname = '/x-callback-url';

  private readonly server: Server;
  private readonly sockets: Set<Socket> = new Set();
  private readonly requiredParamsKeys = ['service', 'shortcutName', 'status'] as const;

  public get baseUrl(): string {
    return `${this.proto}://${this.hostname}:${this.port}${this.pathname}`;
  }

  constructor(
    private readonly accessory: Nullable<ShortcutsButtonsPlatformAccessory>,
    private readonly config: ShortcutsButtonsPlatformConfig,
    private readonly log: Logger,
    private readonly utils: ShortcutsButtonsUtils,
    api: API,
  ) {
    this.hostname = config.shortcutResultCallback.callbackServerHostname;
    this.port = config.shortcutResultCallback.callbackServerPort;

    this.server = this.create();

    api.on('shutdown', this.destroy);
  }

  private create(): Server {
    const server = createServer(this.reqListener);

    server.listen(this.port, this.hostname);

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
  }

  private reqListener = async (
    { headers, method, url }: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> => {
    if (typeof url !== 'string' || method !== 'GET') {
      this.log.error('Unsupported http request', headers);
      res.writeHead(404).end();
      return;
    }

    const { pathname, searchParams } = new URL(url, `http://${headers.host}`);

    if (pathname !== this.pathname) {
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

    try {
      await this.runCallbackScript(requiredParamsMap, searchParams);
    } catch (e) {
      this.log.error('Unable to run callback script', e);
      res.writeHead(400).end();
      return;
    }

    this.log.success(
      `Executed callback script for shortcut ${requiredParamsMap.get('shortcutName')}`,
      url,
    );
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

    const serviceConfig = this.config.buttons.find((service) => service.shortcut === shortcutName);

    return (
      this.accessory.services.findIndex(
        (service) => service.UUID === serviceUUID && service.displayName === serviceConfig?.name,
      ) !== -1
    );
  }

  private async runCallbackScript(
    requiredParamsMap: ReturnType<typeof this.getValidatedRequiredParams>,
    searchParams: URLSearchParams,
  ): Promise<void> {
    let script = this.config.shortcutResultCallback.callbackCustomCommand;

    if (typeof script !== 'string' || script.trim().length === 0) {
      script = this.getDefaultCallbackScript(requiredParamsMap, searchParams);
    }

    await this.utils.execAsync(script, {
      timeout: 10000,
      env: {
        SHORTCUT_NAME: requiredParamsMap.get('shortcutName'),
        SHORTCUT_RESULT: requiredParamsMap.get('status'),
      },
    });
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
      `open ${join(__dirname, './bin/defaultCallbackScript.app')} ` +
      `--env TITLE="${this.config.name}" ` +
      `--env SUBTITLE="${requiredParamsMap.get('shortcutName')} ${subtitle}" ` +
      `--env SOUND="${sound}" ` +
      `--env PATHNAME="${this.pathname}"`
    );
  }
}
