import { ExecOptions, exec } from 'child_process';
import { ObjectEncodingOptions } from 'fs';
import { Logger } from 'homebridge';
import { promisify } from 'util';

export class HSBUtils {
  constructor(private readonly log: Logger) {}

  public async execAsync(
    command: string,
    options?: ObjectEncodingOptions & ExecOptions,
  ): Promise<void> {
    const { stdout, stderr } = await promisify(exec).call(null, command, options);
    stdout.length > 0 && this.log.debug(stdout.toString());
    stderr.length > 0 && this.log.error(stderr.toString());
  }
}
