import { execSync } from 'child_process';

import { XCallbackUrlServer } from './server';

export const enum ShortcutStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  CANCEL = 'cancel',
}

export class Shortcut {
  constructor(
    private readonly shortcutName: string,
    private readonly serviceUUID: string,
  ) {}

  public run(): void {
    execSync(`open -gj ${this.shortcutUrl}`, {
      stdio: 'inherit',
      shell: 'bash',
    });
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
      `x-${status}="${XCallbackUrlServer.baseUrl}\?` +
      `shortcutName=${this.shortcutName}%26` +
      `service=${this.serviceUUID}%26` +
      `status=${status}"`
    );
  }
}
