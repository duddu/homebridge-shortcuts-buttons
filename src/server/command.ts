import { HSBConfig } from '../config';
import { HSBXCallbackUrlSearchParamsType } from './params';
import { HSBShortcutStatus } from '../shortcut';
import { HSBUtils } from '../utils';
import { join } from 'path';

export class HSBXCallbackUrlServerCommand {
  constructor(
    private readonly config: HSBConfig,
    private readonly utils: HSBUtils,
  ) {}

  public async run(searchParams: HSBXCallbackUrlSearchParamsType): Promise<void> {
    let command = this.config.callbackCustomCommand;

    if (!this.utils.isNonEmptyString(command)) {
      command = this.getDefaultCommand(searchParams);
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

  private getDefaultCommand(searchParams: HSBXCallbackUrlSearchParamsType): string {
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
      `open ${this.defaultCommandAppPath} ` +
      `--env NOTIFICATION_TITLE="${this.config.name}" ` +
      `--env NOTIFICATION_SUBTITLE="${searchParams.shortcut} ${subtitle}" ` +
      `--env NOTIFICATION_SOUND="${sound}"`
    );
  }

  private readonly defaultCommandAppPath = join(
    __dirname,
    './bin/HomebridgeShortcutsButtons\\ -\\ Notify\\ Shortcut\\ Result.app',
  );
}
