import { Logger } from 'homebridge';
import { join } from 'path';

import { HSBConfig } from '../config';
import { HSBXCallbackUrlSearchParamsType } from './params';
import { HSBShortcut, HSBShortcutStatus } from '../shortcut';
import { HSBUtils } from '../utils';

export class HSBXCallbackUrlServerCommand {
  constructor(
    private readonly log: Logger,
    private readonly config: HSBConfig,
    private readonly utils: HSBUtils,
  ) {}

  public async run(searchParams: HSBXCallbackUrlSearchParamsType): Promise<void> {
    let command: string | undefined;
    const commandVariables = {
      SHORTCUT_NAME: searchParams.shortcut,
      SHORTCUT_STATUS: searchParams.status,
      SHORTCUT_RESULT: searchParams.result,
      SHORTCUT_ERROR: searchParams.errorMessage,
    };

    switch (this.config.callbackCommandType) {
      case 'Default (display notification)':
        command = this.getDefaultCommand(searchParams);
        break;
      case 'Custom unix command':
        command = this.config.callbackCustomCommand;
        if (!this.utils.isNonEmptyString(command)) {
          throw new Error(
            'HSBXCallbackUrlServerCommand::run' +
              `"${this.config.callbackCommandType}" was chosen but no command was configured`,
          );
        }
        break;
      case 'Shortcut name':
        if (!this.utils.isNonEmptyString(this.config.callbackCustomCommand)) {
          throw new Error(
            'HSBXCallbackUrlServerCommand::run' +
              `"${this.config.callbackCommandType}" was chosen but no shortcut name was configured`,
          );
        }
        return this.runShortcut(commandVariables);
      default:
        throw new Error(
          'HSBXCallbackUrlServerCommand::run Unexpected value provided for callbackCommandType: ' +
            this.config.callbackCommandType,
        );
    }

    if (!this.utils.isNonEmptyString(command)) {
      throw new Error(
        'HSBXCallbackUrlServerCommand::run Callback command configuration field is empty',
      );
    }

    await this.utils.execAsync(command, {
      env: commandVariables,
      timeout: this.config.callbackCommandTimeout,
    });
  }

  private runShortcut(commandVariables: { [K: string]: string | undefined }): Promise<void> {
    const shortcutTextInput = Buffer.from(JSON.stringify(commandVariables)).toString('base64');
    const shortcut = new HSBShortcut(
      this.config.callbackCustomCommand!,
      null,
      this.utils,
      shortcutTextInput,
    );
    return shortcut.run();
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
    '../bin/HomebridgeShortcutsButtons\\ -\\ Notify\\ Shortcut\\ Result.app',
  );
}
