import { Nullable } from 'homebridge';

import { HSBXCallbackUrlServer } from './server/index.js';
import { HSBUtils } from './utils.js';

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
    private readonly input?: string | undefined,
  ) {
    this.name = encodeURIComponent(name);
  }

  public async run(): Promise<void> {
    return this.utils.execAsync(`open -gj ${this.shortcutUrl}`);
  }

  private get isWithXCallbackUrl(): boolean {
    return this.server !== null && typeof this.input === 'undefined';
  }

  private get isWithTextInput(): boolean {
    return HSBUtils.isNonEmptyString(this.input);
  }

  private get shortcutUrl(): string {
    let url = 'shortcuts://';
    if (this.isWithXCallbackUrl === true) {
      url += 'x-callback-url/';
    }
    url += `run-shortcut\\?name=${this.name}`;
    if (this.isWithXCallbackUrl === true) {
      url += `\\&${this.callbackXParams}`;
    }
    if (this.isWithTextInput === true) {
      url += `\\&${this.textInputParams}`;
    }
    return url;
  }

  private get textInputParams(): string {
    return `input=text\\&text=${this.input}`;
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
