import { jest } from '@jest/globals';

import { HSBXCallbackUrlServer } from '../../src/server';

type HSBXCallbackUrlServerProto = typeof HSBXCallbackUrlServer.prototype;
type HSBXCallbackUrlServerPublic = {
  [K in keyof HSBXCallbackUrlServerProto]: HSBXCallbackUrlServerProto[K];
};

class HSBXCallbackUrlServerMock implements HSBXCallbackUrlServerPublic {
  public baseUrl = 'baseUrlMock';
  public issueToken = jest.fn(() => 'tokenMock');
}

jest.mock('../../src/server', () => ({
  HSBXCallbackUrlServer: HSBXCallbackUrlServerMock,
}));

export const HSBXCallbackUrlServerMockedInstance =
  new HSBXCallbackUrlServerMock() as unknown as HSBXCallbackUrlServer;
