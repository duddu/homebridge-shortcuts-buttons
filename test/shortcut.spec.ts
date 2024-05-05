import { describe, expect, test, beforeEach, jest } from '@jest/globals';

import { HSBShortcut } from '../src/shortcut';

import { utilsMockedInstance } from './mocks/utils.mock';
import { xCallbackUrlServerMockedInstance } from './mocks/server.mock';

describe(HSBShortcut.name, () => {
  let shortcut: HSBShortcut;

  describe(HSBShortcut.prototype.run.name, () => {
    describe('when the x-callback-url server is running', () => {
      beforeEach(() => {
        shortcut = new HSBShortcut(
          'Shortcut Mock',
          xCallbackUrlServerMockedInstance,
          utilsMockedInstance,
          undefined,
        );
      });

      test('should open the shortcut url including x-callback-url parameters', async () => {
        const commandMock =
          'open -gj shortcuts://x-callback-url/run-shortcut\\?name=Shortcut%20Mock\\&' +
          'x-success="baseUrlMock?shortcut=Shortcut%20Mock%26status=success%26token=tokenMock"\\&' +
          'x-error="baseUrlMock?shortcut=Shortcut%20Mock%26status=error%26token=tokenMock"\\&' +
          'x-cancel="baseUrlMock?shortcut=Shortcut%20Mock%26status=cancel%26token=tokenMock"';

        await shortcut.run();
        expect(utilsMockedInstance.execAsync).toHaveBeenNthCalledWith(1, commandMock);
      });
    });

    describe('when the x-callback-url server is not running', () => {
      beforeEach(() => {
        shortcut = new HSBShortcut('Shortcut Mock', null, utilsMockedInstance, undefined);
      });

      test('should open the shortcut url without x-callback-url parameters', async () => {
        const commandMock = 'open -gj shortcuts://run-shortcut\\?name=Shortcut%20Mock';

        await shortcut.run();
        expect(utilsMockedInstance.execAsync).toHaveBeenNthCalledWith(1, commandMock);
      });
    });

    describe('when the shortcut is instantiated with input', () => {
      beforeEach(() => {
        jest.spyOn(utilsMockedInstance, 'isNonEmptyString').mockReturnValueOnce(true);
        shortcut = new HSBShortcut(
          'Shortcut Mock',
          null,
          utilsMockedInstance,
          'shortcutTextInputMock',
        );
      });

      test('should open the shortcut with text input parameters', async () => {
        const commandMock =
          'open -gj shortcuts://run-shortcut\\?name=Shortcut%20Mock' +
          '\\&input=text\\&text=shortcutTextInputMock';

        await shortcut.run();
        expect(utilsMockedInstance.execAsync).toHaveBeenNthCalledWith(1, commandMock);
      });
    });
  });
});
