import { describe, expect, test, jest } from '@jest/globals';
import { Logger } from 'homebridge/lib/logger';

import { HSBUtils } from '../src/utils';

jest.mock('homebridge/lib/logger');

const execMock = jest.fn(() => ({
  stdout: 'stdout',
  stderr: 'stderr',
}));
jest.mock('util', () => ({
  promisify: () => execMock,
}));

describe(HSBUtils.name, () => {
  const logger = new Logger();
  const utils = new HSBUtils(logger);

  describe(utils.execAsync.name, () => {
    test('should call child_process.exec with default timeout', async () => {
      await utils.execAsync('cmd');
      expect(execMock).toHaveBeenNthCalledWith(1, 'cmd', { timeout: 5000 });
    });

    test('should call child_process.exec method with custom timeout', async () => {
      await utils.execAsync('cmd', { timeout: 10000 });
      expect(execMock).toHaveBeenNthCalledWith(1, 'cmd', { timeout: 10000 });
    });

    test('should call child_process.exec method with custom options', async () => {
      await utils.execAsync('cmd', { shell: 'zsh' });
      expect(execMock).toHaveBeenNthCalledWith(1, 'cmd', { timeout: 5000, shell: 'zsh' });
    });

    test('should log stdout returned from executed command', async () => {
      await utils.execAsync('cmd');
      expect(logger.debug).toHaveBeenNthCalledWith(2, 'stdout');
    });

    test('should log stderr returned from executed command', async () => {
      await utils.execAsync('cmd');
      expect(logger.error).toHaveBeenNthCalledWith(1, 'stderr');
    });
  });

  describe(utils.isNonEmptyString.name, () => {
    test('should return false when provided with non-string ', () => {
      expect(utils.isNonEmptyString(1)).toBe(false);
    });

    test('should return false when provided with empty string', () => {
      expect(utils.isNonEmptyString('')).toBe(false);
    });

    test('should return false when provided with empty string with padding', () => {
      expect(utils.isNonEmptyString('  ')).toBe(false);
    });

    test('should return true when provided with non-empty string', () => {
      expect(utils.isNonEmptyString('a')).toBe(true);
    });
  });
});
