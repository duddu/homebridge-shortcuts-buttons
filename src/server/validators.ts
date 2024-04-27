class HSBXCallbackUrlRequestValidator {
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

type HSBXCallbackUrlRequestValidatorsMap = {
  [K: string]: Omit<HSBXCallbackUrlRequestValidator, 'passed'>;
};

export const createRequestValidators = (
  validatorsMap: HSBXCallbackUrlRequestValidatorsMap,
): HSBXCallbackUrlRequestValidator[] => {
  return Object.values(validatorsMap).map(
    ({ condition, errorCode, errorMessage }) =>
      new HSBXCallbackUrlRequestValidator(condition, errorCode, errorMessage),
  );
};
