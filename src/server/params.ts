import { URLSearchParams } from 'url';

import { HSBShortcutStatus } from '../shortcut';
import { HSBUtils } from '../utils';

enum HSBXCallbackUrlRequiredSearchParamsKeys {
  SHORTCUT = 'shortcut',
  STATUS = 'status',
  TOKEN = 'token',
}

enum HSBXCallbackUrlOptionalSearchParamsKeys {
  ERROR_MESSAGE = 'errorMessage',
  RESULT = 'result',
}

export const requiredParamsKeysList = Object.values(HSBXCallbackUrlRequiredSearchParamsKeys);
export const optionalParamsKeysList = Object.values(HSBXCallbackUrlOptionalSearchParamsKeys);

export type HSBXCallbackUrlSearchParamsType = {
  [K in HSBXCallbackUrlRequiredSearchParamsKeys]: string;
} & {
  [HSBXCallbackUrlRequiredSearchParamsKeys.STATUS]: HSBShortcutStatus;
} & {
  [K in HSBXCallbackUrlOptionalSearchParamsKeys]: string | undefined;
};

export class HSBXCallbackUrlSearchParams implements HSBXCallbackUrlSearchParamsType {
  public readonly shortcut!: string;
  public readonly status!: HSBShortcutStatus;
  public readonly token!: string;
  public readonly result: string | undefined;
  public readonly errorMessage: string | undefined;

  constructor(
    searchParams: URLSearchParams,
    private readonly utils: HSBUtils,
  ) {
    for (const key of requiredParamsKeysList) {
      if (key === HSBXCallbackUrlRequiredSearchParamsKeys.STATUS) {
        this[key] = searchParams.get(key) as HSBShortcutStatus;
      } else {
        this[key] = searchParams.get(key) as string;
      }
    }
    for (const key of optionalParamsKeysList) {
      const value = searchParams.get(key);
      this[key] = utils.isNonEmptyString(value) ? value : undefined;
    }
  }

  public areValidRequiredParamsValues = (): boolean => {
    return requiredParamsKeysList.every((key) => this.utils.isNonEmptyString(this[key]));
  };
}
