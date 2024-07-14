import { ExecOptions, exec } from 'child_process';
import { ObjectEncodingOptions } from 'fs';
import { Logging } from 'homebridge';
import { promisify } from 'util';

const EXEC_DEFAULT_TIMEOUT = 5000;

export class HSBUtils {
  constructor(private readonly log: Logging) {}

  public async execAsync(
    command: string,
    options?: ObjectEncodingOptions & ExecOptions,
  ): Promise<void> {
    this.log.debug(`${this.constructor.name}::${this.execAsync.name} Executing`, command);
    const { stdout, stderr } = await promisify(exec).call(null, command, {
      timeout: EXEC_DEFAULT_TIMEOUT,
      ...options,
    });
    HSBUtils.isNonEmptyString(stdout.toString()) && this.log.debug(stdout.toString());
    HSBUtils.isNonEmptyString(stderr.toString()) && this.log.error(stderr.toString());
  }

  public static isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim() !== '';
}
