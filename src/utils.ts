import { ExecOptions, exec } from 'child_process';
import { ObjectEncodingOptions } from 'fs';
import { Logger } from 'homebridge';
import { promisify } from 'util';

const EXEC_DEFAULT_TIMEOUT = 5000;

export class HSBUtils {
  constructor(private readonly log: Logger) {}

  public async execAsync(
    command: string,
    options?: ObjectEncodingOptions & ExecOptions,
  ): Promise<void> {
    this.log.debug('Utils::execAsync Executing:', command);
    const { stdout, stderr } = await promisify(exec).call(null, command, {
      timeout: EXEC_DEFAULT_TIMEOUT,
      ...options,
    });
    this.isNonEmptyString(stdout.toString()) && this.log.debug(stdout.toString());
    this.isNonEmptyString(stderr.toString()) && this.log.error(stderr.toString());
  }

  public isNonEmptyString = isNonEmptyString;
}

export const isNonEmptyString = (str: unknown): str is string => {
  return typeof str === 'string' && str.trim() !== '';
};
