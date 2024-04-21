import { execFile } from 'child_process';
import { Logger, Nullable } from 'homebridge';
import { promisify } from 'util';

export const enum ShortcutStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  CANCEL = 'cancel',
}

export class Shortcut {
  constructor(
    private readonly shortcutName: string,
    private readonly serviceUUID: string,
    private readonly serverBaseUrl: Nullable<string>,
    private readonly log: Logger,
  ) {}

  public async run(): Promise<void> {
    const { stdout, stderr } = await promisify(execFile).call(
      null,
      'open',
      ['-gj', this.shortcutUrl],
      {
        timeout: 5000,
      },
    );
    this.log.error(stderr.toString());
    this.log.debug(stdout.toString());
  }

  private get shortcutUrl(): string {
    return (
      `shortcuts://x-callback-url/run-shortcut\\?name=${this.shortcutName}\\&` +
      `${this.getCallbackParam(ShortcutStatus.SUCCESS)}\\&` +
      `${this.getCallbackParam(ShortcutStatus.ERROR)}\\&` +
      `${this.getCallbackParam(ShortcutStatus.CANCEL)}`
    );
  }

  private getCallbackParam(status: ShortcutStatus): string {
    return (
      // eslint-disable-next-line no-useless-escape
      `x-${status}="${this.serverBaseUrl}\?` +
      `shortcutName=${this.shortcutName}%26` +
      `service=${this.serviceUUID}%26` +
      `status=${status}"`
    );
  }
}
