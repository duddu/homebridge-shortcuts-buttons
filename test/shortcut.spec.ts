import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';

import { HSBShortcut } from '../src/shortcut';
import { HSBUtilsMockedInstance } from './mocks/utils.mock';
import { HSBXCallbackUrlServerMockedInstance } from './mocks/server.mock';

describe(HSBShortcut.name, () => {
  let shortcut: HSBShortcut;

  afterEach(() => {
    delete global.shortcut;
  });

  describe(HSBShortcut.prototype.run.name, () => {
    describe('when the x-callback-url server is running', () => {
      beforeEach(() => {
        shortcut = new HSBShortcut(
          'shortcutMock',
          HSBXCallbackUrlServerMockedInstance,
          HSBUtilsMockedInstance,
        );
      });

      test('should open the shortcut url including x-callback-url parameters', async () => {
        const commandMock =
          'open -gj shortcuts://x-callback-url/run-shortcut\\?name=shortcutMock\\&' +
          'x-success="baseUrlMock?shortcut=shortcutMock%26status=success%26token=tokenMock"\\&' +
          'x-error="baseUrlMock?shortcut=shortcutMock%26status=error%26token=tokenMock"\\&' +
          'x-cancel="baseUrlMock?shortcut=shortcutMock%26status=cancel%26token=tokenMock"';

        await shortcut.run();
        expect(HSBUtilsMockedInstance.execAsync).toHaveBeenNthCalledWith(1, commandMock);
      });
    });

    describe('when the x-callback-url server is not running', () => {
      beforeEach(() => {
        shortcut = new HSBShortcut('shortcutMock', null, HSBUtilsMockedInstance);
      });

      test('should open the shortcut url without x-callback-url parameters', async () => {
        const commandMock = 'open -gj shortcuts://run-shortcut\\?name=shortcutMock';

        await shortcut.run();
        expect(HSBUtilsMockedInstance.execAsync).toHaveBeenNthCalledWith(1, commandMock);
      });
    });
  });
});
