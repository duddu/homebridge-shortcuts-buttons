import { jest } from '@jest/globals';

import { HSBUtils } from '../../src/utils';

type HSBUtilsProto = typeof HSBUtils.prototype;
type HSBUtilsPublic = { [K in keyof HSBUtilsProto]: HSBUtilsProto[K] };

class HSBUtilsMock implements HSBUtilsPublic {
  public execAsync = jest.fn(() => Promise.resolve());
  public isNonEmptyString = jest.fn(
    () => true,
  ) as unknown as typeof HSBUtils.prototype.isNonEmptyString;
}

jest.mock('../../src/utils', () => ({
  HSBUtils: HSBUtilsMock,
}));

export const HSBUtilsMockedInstance = new HSBUtilsMock() as unknown as HSBUtils;
