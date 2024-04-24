import { Nullable } from 'homebridge';
import { HSBUtils } from './utils';
import { HSBXCallbackUrlServer } from './server';

export const enum HSBShortcutStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  CANCEL = 'cancel',
}

export class HSBShortcut {
  constructor(
    private readonly name: string,
    private readonly server: Nullable<HSBXCallbackUrlServer>,
    private readonly utils: HSBUtils,
  ) {}

  public async run(): Promise<void> {
    return this.utils.execAsync(`open -gj ${this.shortcutUrl}`);
  }

  private get shortcutUrl(): string {
    if (this.server === null) {
      return `shortcuts://run-shortcut\\?name=${this.name}`;
    }
    return (
      `shortcuts://x-callback-url/run-shortcut\\?name=${this.name}\\&` +
      `${this.getCallbackXParam(HSBShortcutStatus.SUCCESS)}\\&` +
      `${this.getCallbackXParam(HSBShortcutStatus.ERROR)}\\&` +
      `${this.getCallbackXParam(HSBShortcutStatus.CANCEL)}`
    );
  }

  private getCallbackXParam(status: HSBShortcutStatus): string {
    if (this.server === null) {
      throw new ReferenceError('cannot invoke getCallbackParam whilst server is null');
    }
    return (
      // eslint-disable-next-line no-useless-escape
      `x-${status}="${this.server.baseUrl}\?` +
      `token=${this.server.issueToken()}%26` +
      `shortcut=${this.name}%26` +
      `status=${status}"`
    );
  }
}
