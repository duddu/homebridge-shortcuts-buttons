import { Nullable } from 'homebridge';
import { HSBUtils } from './utils';
import { HSBXCallbackUrlServer } from './server';

export enum HSBShortcutStatus {
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
    let url = 'shortcuts://';
    this.server !== null && (url += 'x-callback-url/');
    url += `run-shortcut\\?name=${this.name}`;
    this.server !== null && (url += `\\&${this.callbackXParams}`);
    return url;
  }

  private get callbackXParams(): string {
    return Object.values(HSBShortcutStatus)
      .map((status) => this.getCallbackXParam(status))
      .join('\\&');
  }

  private getCallbackXParam(status: HSBShortcutStatus): string {
    return (
      // eslint-disable-next-line no-useless-escape
      `x-${status}="${this.server?.baseUrl}\?` +
      `shortcut=${this.name}%26` +
      `status=${status}%26` +
      `token=${this.server?.issueToken()}"`
    );
  }
}
