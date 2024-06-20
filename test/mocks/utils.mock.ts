import { jest } from '@jest/globals';

import { HSBUtils } from '../../src/utils';

type HSBUtilsProto = typeof HSBUtils.prototype;
type HSBUtilsPublic = { [K in keyof HSBUtilsProto]: HSBUtilsProto[K] };

export class HSBUtilsMock implements HSBUtilsPublic {
  public execAsync = jest.fn(() => Promise.resolve());
  public static isNonEmptyString = jest.fn() as unknown as (typeof HSBUtils)['isNonEmptyString'];
}

jest.mock('../../src/utils', () => ({
  HSBUtils: HSBUtilsMock,
}));

export const utilsMockedInstance = new HSBUtilsMock() as unknown as HSBUtils;
