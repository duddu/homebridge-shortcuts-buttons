import { describe, expect, test, jest } from '@jest/globals';

import { HSBUtils } from '../src/utils';
import { hbLoggerMockedInstance } from './mocks/logger.mock';

jest.mock('homebridge/lib/logger');

const execMock = jest.fn(() => ({
  stdout: 'stdout',
  stderr: 'stderr',
}));
jest.mock('util', () => ({
  promisify: () => execMock,
}));

describe(HSBUtils.name, () => {
  const utils = new HSBUtils(hbLoggerMockedInstance);

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
      expect(hbLoggerMockedInstance.debug).toHaveBeenNthCalledWith(2, 'stdout');
    });

    test('should log stderr returned from executed command', async () => {
      await utils.execAsync('cmd');
      expect(hbLoggerMockedInstance.error).toHaveBeenNthCalledWith(1, 'stderr');
    });
  });

  describe(HSBUtils.isNonEmptyString.name, () => {
    test('should return false when provided with non-string ', () => {
      expect(HSBUtils.isNonEmptyString(1)).toBe(false);
    });

    test('should return false when provided with empty string', () => {
      expect(HSBUtils.isNonEmptyString('')).toBe(false);
    });

    test('should return false when provided with empty string with padding', () => {
      expect(HSBUtils.isNonEmptyString('  ')).toBe(false);
    });

    test('should return true when provided with non-empty string', () => {
      expect(HSBUtils.isNonEmptyString('a')).toBe(true);
    });
  });
});
