import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { API, Logging } from 'homebridge';

import { HSBDevice } from '../src/accessory';
import { HSBConfig } from '../src/config';
import { HSBPlatform } from '../src/platform';
import { PLATFORM_NAME, PLUGIN_NAME } from '../src/settings';

import { hbApiMockedInstance, hbApiMockedPlatformAccessoryConstructorSpy } from './mocks/api.mock';
import { hbLoggerMockedInstance } from './mocks/logger.mock';

const accessoryMockConstructorSpy = jest.fn();
jest.mock('../src/accessory', () => ({
  HSBAccessory: class {
    constructor(...args: unknown[]) {
      accessoryMockConstructorSpy(...args);
    }
  },
  HSBDevice: jest.requireActual<typeof import('../src/accessory')>('../src/accessory').HSBDevice,
}));

const serverMockConstructorSpy = jest.fn();
jest.mock('../src/server', () => ({
  HSBXCallbackUrlServer: class {
    constructor(...args: unknown[]) {
      serverMockConstructorSpy(...args);
    }
  },
}));

jest.mock('../src/utils', () => ({
  HSBUtils: class {},
}));

describe(HSBPlatform.name, () => {
  let platform: HSBPlatform;
  let config: HSBConfig;
  let device: HSBDevice;

  const instantiatePlatform = (
    configOverride?: Partial<HSBConfig>,
    logger = hbLoggerMockedInstance,
  ) => {
    config = {
      name: 'platformMock',
      accessoryName: 'accessoryNameMock',
      callbackServerEnabled: true,
      ...configOverride,
    } as HSBConfig;
    platform = new HSBPlatform(logger, config, hbApiMockedInstance as unknown as API);
    device = new HSBDevice(config);
  };

  afterEach(() => {
    hbApiMockedInstance.removeAllListeners();
  });

  describe('constructor', () => {
    test('should polydsfill logger success method', () => {
      const legacyLogger = { ...hbLoggerMockedInstance };
      delete (legacyLogger as Partial<Logging>).success;
      instantiatePlatform(undefined, legacyLogger as Logging);

      expect(platform.log.success).toBe(legacyLogger.info);
    });

    test('should log platform initialization event', () => {
      instantiatePlatform();

      expect(hbLoggerMockedInstance.info).toHaveBeenCalledTimes(1);
      expect(hbLoggerMockedInstance.info).toHaveBeenCalledWith(
        expect.stringContaining('initialized'),
        config.name,
      );
    });

    describe('api.on:didFinishLaunching', () => {
      test(`should invoke ${HSBPlatform.prototype.discoverDevices.name} method`, () => {
        instantiatePlatform();
        const discoverDevicesSpy = jest.spyOn(platform, 'discoverDevices');

        hbApiMockedInstance.emit('didFinishLaunching');

        expect(discoverDevicesSpy).toHaveBeenCalledTimes(1);
        expect(discoverDevicesSpy).toHaveBeenCalledWith();
      });

      test('should start callback server if enabled', () => {
        instantiatePlatform();

        hbApiMockedInstance.emit('didFinishLaunching');

        expect(serverMockConstructorSpy).toHaveBeenCalledTimes(1);
        expect(serverMockConstructorSpy).toHaveBeenLastCalledWith(
          config,
          hbLoggerMockedInstance,
          {},
          hbApiMockedInstance,
        );
      });

      test('should not start callback server if disabled', () => {
        instantiatePlatform({
          callbackServerEnabled: false,
        });

        hbApiMockedInstance.emit('didFinishLaunching');

        expect(serverMockConstructorSpy).toHaveBeenCalledTimes(0);
      });
    });

    describe(HSBPlatform.prototype.configureAccessory.name, () => {
      test('should save input accessory', () => {
        const accessory = new hbApiMockedInstance.platformAccessory(
          'deviceDisplayNameMock',
          'c7eadfc3-3e3b-4a4b-906b-572406e7ee6e',
        );
        instantiatePlatform();

        platform.configureAccessory(accessory);

        expect(platform.accessory).toBe(accessory);
      });
    });

    describe(HSBPlatform.prototype.discoverDevices.name, () => {
      test('should generate uuid from device serial number', () => {
        instantiatePlatform();

        platform.discoverDevices();

        expect(hbApiMockedInstance.hap.uuid.generate).toHaveBeenCalledTimes(1);
        expect(hbApiMockedInstance.hap.uuid.generate).toHaveBeenCalledWith(device.serialNumber);
      });

      describe('if platform accessory is not cached', () => {
        beforeEach(() => {
          instantiatePlatform();
          platform.discoverDevices();
        });

        test('should create new platform accessory from device', () => {
          expect(hbApiMockedPlatformAccessoryConstructorSpy).toHaveBeenCalledTimes(1);
          expect(hbApiMockedPlatformAccessoryConstructorSpy).toHaveBeenCalledWith(
            device.displayName,
            hbApiMockedInstance.hap.uuid.generate(device.serialNumber),
          );
        });

        test('should copy device data onto accessory context', () => {
          expect(platform.accessory?.context.device).toEqual(device);
        });

        test('should register new platform accessory', () => {
          expect(hbApiMockedInstance.registerPlatformAccessories).toHaveBeenCalledTimes(1);
          expect(hbApiMockedInstance.registerPlatformAccessories).toHaveBeenCalledWith(
            PLUGIN_NAME,
            PLATFORM_NAME,
            [platform.accessory],
          );
        });

        test('should log accessory registration info', () => {
          expect(hbLoggerMockedInstance.info).toHaveBeenLastCalledWith(
            expect.any(String),
            expect.stringMatching(/registered/i),
            platform.accessory?.displayName,
          );
        });

        test('should instantiate new accessory object', () => {
          expect(accessoryMockConstructorSpy).toHaveBeenCalledTimes(1);
          expect(accessoryMockConstructorSpy).toHaveBeenCalledWith(platform, platform.accessory);
        });
      });

      describe('if platform accessory is cached', () => {
        beforeEach(() => {
          instantiatePlatform();
          platform.configureAccessory(
            new hbApiMockedInstance.platformAccessory(
              device.displayName,
              hbApiMockedInstance.hap.uuid.generate(device.serialNumber),
            ),
          );
          platform.discoverDevices();
        });

        test('should log accessory restoration info', () => {
          expect(hbLoggerMockedInstance.info).toHaveBeenLastCalledWith(
            expect.any(String),
            expect.stringMatching(/restored/i),
            platform.accessory?.displayName,
          );
        });

        test('should instantiate new accessory object', () => {
          expect(accessoryMockConstructorSpy).toHaveBeenCalledTimes(1);
          expect(accessoryMockConstructorSpy).toHaveBeenCalledWith(platform, platform.accessory);
        });

        describe('if device displayName has been changed', () => {
          beforeEach(() => {
            instantiatePlatform();
            platform.configureAccessory(
              new hbApiMockedInstance.platformAccessory(
                'outdatedAccessoryNameMock',
                hbApiMockedInstance.hap.uuid.generate(device.serialNumber),
              ),
            );
            platform.discoverDevices();
          });

          test('should update platform accessory displayName', () => {
            expect(platform.accessory?.displayName).toBe(device.displayName);
          });

          test('should update platform accessory context device', () => {
            expect(platform.accessory?.context.device).toEqual(device);
          });

          test('should invoke updatePlatformAccessories api method', () => {
            expect(hbApiMockedInstance.updatePlatformAccessories).toHaveBeenCalledTimes(1);
            expect(hbApiMockedInstance.updatePlatformAccessories).toHaveBeenCalledWith([
              platform.accessory,
            ]);
          });
        });
      });
    });
  });
});
