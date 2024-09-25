import { describe, expect, jest, test } from '@jest/globals';
import { API } from 'homebridge';

import index from '../src/index';
import { HSBPlatform } from '../src/platform';

const HomebridgeAPIMock = {
  registerPlatform: jest.fn(),
};
jest.mock('homebridge', () => ({
  API: HomebridgeAPIMock,
}));

describe('API.registerPlatform', () => {
  test('should request platform registration with correct arguments', () => {
    index(HomebridgeAPIMock as unknown as API);
    expect(HomebridgeAPIMock.registerPlatform).toHaveBeenNthCalledWith(
      1,
      'homebridge-shortcuts-buttons',
      'HomebridgeShortcutsButtons',
      HSBPlatform,
    );
  });
});
