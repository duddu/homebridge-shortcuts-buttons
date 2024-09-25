/**
 * @module server
 */

interface HSBXCallbackUrlRequestValidatorDescriptor {
  readonly condition: () => boolean;
  readonly errorCode: number;
  readonly errorMessage: string;
}

type HSBXCallbackUrlRequestValidatorsKeys =
  | 'hasValidMethod'
  | 'hasValidPathname'
  | 'hasValidSearchParams'
  | 'hasValidAuthToken';

type HSBXCallbackUrlRequestValidatorsDescriptors = Readonly<
  Record<HSBXCallbackUrlRequestValidatorsKeys, HSBXCallbackUrlRequestValidatorDescriptor>
>;

class HSBXCallbackUrlRequestValidator implements HSBXCallbackUrlRequestValidatorDescriptor {
  constructor(
    public readonly condition: () => boolean,
    public readonly errorCode: number,
    public readonly errorMessage: string,
  ) {
    Object.freeze(this);
  }

  public test(): boolean {
    try {
      return this.condition() === true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return false;
    }
  }
}

export const createRequestValidators = (
  validatorsDescriptors: HSBXCallbackUrlRequestValidatorsDescriptors,
): ReadonlyArray<HSBXCallbackUrlRequestValidator> =>
  Object.freeze(
    Object.values(validatorsDescriptors).map(
      ({ condition, errorCode, errorMessage }) =>
        new HSBXCallbackUrlRequestValidator(condition, errorCode, errorMessage),
    ),
  );
