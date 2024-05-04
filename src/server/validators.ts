/**
 * @module server
 */

interface HSBXCallbackUrlRequestValidatorsMapValue {
  readonly condition: () => boolean;
  readonly errorCode: number;
  readonly errorMessage: string;
}

interface HSBXCallbackUrlRequestValidatorsMap {
  [K: string]: HSBXCallbackUrlRequestValidatorsMapValue;
}

class HSBXCallbackUrlRequestValidator implements HSBXCallbackUrlRequestValidatorsMapValue {
  constructor(
    public readonly condition: () => boolean,
    public readonly errorCode: number,
    public readonly errorMessage: string,
  ) {}

  public get passed(): boolean {
    try {
      return this.condition() === true;
    } catch (e) {
      return false;
    }
  }
}

export const createRequestValidators = (
  validatorsMap: HSBXCallbackUrlRequestValidatorsMap,
): HSBXCallbackUrlRequestValidator[] => {
  return Object.values(validatorsMap).map(
    ({ condition, errorCode, errorMessage }) =>
      new HSBXCallbackUrlRequestValidator(condition, errorCode, errorMessage),
  );
};
