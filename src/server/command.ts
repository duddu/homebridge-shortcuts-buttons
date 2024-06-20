/**
 * @module server
 */

import stringify from 'fast-json-stable-stringify';
import { join } from 'path';

import { HSBConfig } from '../config';
import { HSBXCallbackUrlSearchParams } from './params';
import { HSBShortcut, HSBShortcutStatus } from '../shortcut';
import { HSBUtils } from '../utils';

class HSBXCallbackUrlServerCommandEnvironment {
  public readonly SHORTCUT_NAME: string;
  public readonly SHORTCUT_STATUS: HSBShortcutStatus;
  public readonly SHORTCUT_RESULT?: string;
  public readonly SHORTCUT_ERROR?: string;

  constructor({ shortcut, status, result, errorMessage }: HSBXCallbackUrlSearchParams) {
    if (!shortcut || !status) {
      throw new Error(`${this.constructor.name} Invalid callback url search params`);
    }
    this.SHORTCUT_NAME = shortcut;
    this.SHORTCUT_STATUS = status;
    result && (this.SHORTCUT_RESULT = result);
    errorMessage && (this.SHORTCUT_ERROR = errorMessage);
    Object.freeze(this);
  }
}

export class HSBXCallbackUrlServerCommand {
  private readonly environment: Readonly<HSBXCallbackUrlServerCommandEnvironment>;

  constructor(
    searchParams: HSBXCallbackUrlSearchParams,
    private readonly config: HSBConfig,
    private readonly utils: HSBUtils,
  ) {
    this.environment = new HSBXCallbackUrlServerCommandEnvironment(searchParams);
  }

  public run(): Promise<void> {
    switch (this.config.callbackCommandType) {
      case 'Default (display notification)':
        return this.executeCommand(this.callbackDefaultCommand);
      case 'Custom unix command':
        this.ensureValidCustomCommand();
        return this.executeCommand(this.config.callbackCustomCommand!);
      case 'Shortcut name':
        this.ensureValidCustomCommand();
        return this.runShortcut();
      default:
        return this.throwRunError('Unexpected callback command type configuration value');
    }
  }

  private ensureValidCustomCommand(): void {
    if (!this.utils.isNonEmptyString(this.config.callbackCustomCommand)) {
      this.throwRunError('Missing custom command configuration value');
    }
  }

  private throwRunError(message: string): Promise<void> {
    throw new Error(
      `${this.constructor.name}::${this.run.name} ` +
        `${message} (callbackCommandType=${this.config.callbackCommandType})`,
    );
  }

  private executeCommand(command: string): Promise<void> {
    return this.utils.execAsync(command, {
      env: this.environment,
      timeout: this.config.callbackCommandTimeout,
    });
  }

  private runShortcut(): Promise<void> {
    const input = Buffer.from(stringify(this.environment)).toString('base64');
    const shortcut = new HSBShortcut(this.config.callbackCustomCommand!, null, this.utils, input);
    return shortcut.run();
  }

  private get callbackDefaultCommand(): string {
    let subtitle = this.environment.SHORTCUT_NAME;
    let sound: string;
    switch (this.environment.SHORTCUT_STATUS) {
      case HSBShortcutStatus.SUCCESS:
        subtitle += ' executed successfully';
        this.environment.SHORTCUT_RESULT &&
          (subtitle += `\nResult: ${this.environment.SHORTCUT_RESULT}`);
        sound = 'Glass';
        break;
      case HSBShortcutStatus.ERROR:
        subtitle += ' execution failed';
        this.environment.SHORTCUT_ERROR &&
          (subtitle += `\nError: ${this.environment.SHORTCUT_ERROR}`);
        sound = 'Sosumi';
        break;
      case HSBShortcutStatus.CANCEL:
        subtitle += ' execution was cancelled';
        sound = 'Sosumi';
        break;
      default:
        subtitle += ' received an unknown result status';
        sound = 'Sosumi';
    }

    return (
      `open ${DEFAULT_COMMAND_EXECUTABLE_PATH} ` +
      `--env NOTIFICATION_TITLE="${this.config.name}" ` +
      `--env NOTIFICATION_SUBTITLE="${subtitle}" ` +
      `--env NOTIFICATION_SOUND="${sound}"`
    );
  }
}

const DEFAULT_COMMAND_EXECUTABLE_PATH = join(
  __dirname,
  '../bin/HomebridgeShortcutsButtons\\ -\\ Notify\\ Shortcut\\ Result.app',
);
