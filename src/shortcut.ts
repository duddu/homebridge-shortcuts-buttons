import { Nullable } from 'homebridge';
import { ShortcutsButtonsUtils } from './utils';
import { XCallbackUrlServer } from './server';

export const enum ShortcutStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  CANCEL = 'cancel',
}

export class Shortcut {
  constructor(
    private readonly shortcutName: string,
    private readonly server: Nullable<XCallbackUrlServer>,
    private readonly utils: ShortcutsButtonsUtils,
  ) {}

  public async run(): Promise<void> {
    return this.utils.execAsync(`open -gj ${this.shortcutUrl}`, { timeout: 5000 });
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
      `x-${status}="${this.server?.baseUrl}\?` +
      `token=${this.server?.issueToken()}%26` +
      `shortcutName=${this.shortcutName}%26` +
      `status=${status}"`
    );
  }
}
