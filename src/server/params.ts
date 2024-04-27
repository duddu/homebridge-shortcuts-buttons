import { HSBUtils } from '../utils';
import { URLSearchParams } from 'url';

enum HSBXCallbackUrlRequiredSearchParamsKeys {
  SHORTCUT = 'shortcut',
  STATUS = 'status',
  TOKEN = 'token',
}

enum HSBXCallbackUrlOptionalSearchParamsKeys {
  ERROR_MESSAGE = 'errorMessage',
  RESULT = 'result',
}

const requiredParamsKeysList = Object.values(HSBXCallbackUrlRequiredSearchParamsKeys);
const optionalParamsKeysList = Object.values(HSBXCallbackUrlOptionalSearchParamsKeys);

export type HSBXCallbackUrlSearchParamsType = {
  [K in HSBXCallbackUrlRequiredSearchParamsKeys]: string;
} & {
  [K in HSBXCallbackUrlOptionalSearchParamsKeys]: string | undefined;
};

export class HSBXCallbackUrlSearchParams implements HSBXCallbackUrlSearchParamsType {
  public readonly shortcut!: string;
  public readonly status!: string;
  public readonly token!: string;
  public readonly result: string | undefined;
  public readonly errorMessage: string | undefined;

  constructor(
    searchParams: URLSearchParams,
    private readonly utils: HSBUtils,
  ) {
    for (const key of requiredParamsKeysList) {
      this[key] = searchParams.get(key) || '';
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
