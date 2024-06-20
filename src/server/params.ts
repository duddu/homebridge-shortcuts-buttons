/**
 * @module server
 */

import { URLSearchParams } from 'url';

import { HSBShortcutStatus } from '../shortcut';
import { HSBUtils } from '../utils';

export enum HSBXCallbackUrlRequiredSearchParamsKeys {
  SHORTCUT = 'shortcut',
  STATUS = 'status',
  TOKEN = 'token',
}

enum HSBXCallbackUrlOptionalSearchParamsKeys {
  ERROR_MESSAGE = 'errorMessage',
  RESULT = 'result',
}

type HSBXCallbackUrlSearchParamsDict = {
  [K in HSBXCallbackUrlRequiredSearchParamsKeys | HSBXCallbackUrlOptionalSearchParamsKeys]:
    | (K extends HSBXCallbackUrlRequiredSearchParamsKeys.STATUS ? HSBShortcutStatus : string)
    | null;
};

export class HSBXCallbackUrlSearchParams implements HSBXCallbackUrlSearchParamsDict {
  public readonly shortcut: string | null;
  public readonly status: HSBShortcutStatus | null;
  public readonly token: string | null;
  public readonly result: string | null;
  public readonly errorMessage: string | null;

  constructor(private readonly searchParams: URLSearchParams) {
    this.shortcut = this.getParam(HSBXCallbackUrlRequiredSearchParamsKeys.SHORTCUT);
    this.status = this.getParam(HSBXCallbackUrlRequiredSearchParamsKeys.STATUS);
    this.token = this.getParam(HSBXCallbackUrlRequiredSearchParamsKeys.TOKEN);
    this.result = this.getParam(HSBXCallbackUrlOptionalSearchParamsKeys.RESULT);
    this.errorMessage = this.getParam(HSBXCallbackUrlOptionalSearchParamsKeys.ERROR_MESSAGE);
  }

  private getParam<K extends keyof HSBXCallbackUrlSearchParamsDict, T>(key: K): T | null {
    const value = this.searchParams.get(key) as T | null;
    return HSBUtils.isNonEmptyString(value)
      ? (value.trim().replaceAll(/[\u2018\u2019\u201C\u201D]/g, `'`) as T)
      : null;
  }
}
