import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import stringify from 'fast-json-stable-stringify';
import { Service } from 'hap-nodejs/dist/lib/Service';
import { API } from 'homebridge';

import { HSBAccessory, HSBDevice, HSBPlatformAccessory } from '../src/accessory';
import { HSBConfig } from '../src/config';
import { HSBPlatform } from '../src/platform';
import { PLATFORM_NAME } from '../src/settings';

import { hbApiMockedInstance } from './mocks/api.mock';
import { hbLoggerMockedInstance } from './mocks/logger.mock';

const serviceConstructorSpy = jest.fn();
jest.mock('../src/service', () => ({
  ...jest.requireActual<typeof import('../src/service')>('../src/service'),
  HSBService: class {
    constructor(...args: unknown[]) {
      serviceConstructorSpy(...args);
    }
  },
}));

describe(HSBAccessory.name, () => {
  let platform: HSBPlatform;
  let config: HSBConfig;
  let device: HSBDevice;
  let platformAccessory: HSBPlatformAccessory;
  let cachedService: Service;
  let outdatedCachedService: Service;
  let accessoryInformationService: Service;
  let getServiceSpy: jest.Spied<HSBPlatformAccessory['getService']>;
  let getServiceByIdSpy: jest.Spied<HSBPlatformAccessory['getServiceById']>;
  let addServiceSpy: jest.Spied<HSBPlatformAccessory['addService']>;
  let removeServiceSpy: jest.Spied<HSBPlatformAccessory['removeService']>;
  let setAccessoryInformationCharacteristicSpy: jest.Spied<Service['setCharacteristic']>;

  const instantiateAccessory = (configOverride?: Partial<HSBConfig>) => {
    config = {
      name: 'platformMock',
      accessoryName: 'accessoryNameMock',
      callbackServerEnabled: false,
      services: [
        {
          serviceName: 'buttonMock1',
          shortcutName: 'shortcutNameMock1',
        },
        {
          serviceName: 'buttonMock2',
          shortcutName: 'shortcutNameMock2',
        },
      ],
      serviceType: 'Switch',
      ...configOverride,
    } as HSBConfig;
    platform = new HSBPlatform(
      hbLoggerMockedInstance,
      config,
      hbApiMockedInstance as unknown as API,
    );
    device = new HSBDevice(config);
    platformAccessory = new platform.api.platformAccessory(
      device.displayName,
      platform.api.hap.uuid.generate(device.serialNumber),
    );
    platformAccessory.context.device = device;
    cachedService = platformAccessory.addService(
      platform.api.hap.Service[config.serviceType],
      config.services[0].serviceName,
      platform.api.hap.uuid.generate(
        platform.api.hap.Service[config.serviceType] + stringify(config.services[0]),
      ),
    );
    outdatedCachedService = platformAccessory.addService(
      platform.api.hap.Service[config.serviceType],
      'outdatedServiceMock',
      platform.api.hap.uuid.generate(
        platform.api.hap.Service[config.serviceType] +
          stringify({
            serviceName: 'outdatedServiceMock',
            shortcutName: 'shortcutNameMock3',
          }),
      ),
    );
    accessoryInformationService = platformAccessory.getService(
      platform.api.hap.Service.AccessoryInformation,
    )!;
    getServiceSpy = jest.spyOn(platformAccessory, 'getService');
    getServiceByIdSpy = jest.spyOn(platformAccessory, 'getServiceById');
    addServiceSpy = jest.spyOn(platformAccessory, 'addService');
    removeServiceSpy = jest.spyOn(platformAccessory, 'removeService');
    setAccessoryInformationCharacteristicSpy = jest.spyOn(
      accessoryInformationService,
      'setCharacteristic',
    );
    new HSBAccessory(platform, platformAccessory);
  };

  afterEach(() => {
    hbApiMockedInstance.removeAllListeners();
  });

  describe('constructor', () => {
    test('should catch exceptions and log error', () => {
      config = { accessoryName: 'accessoryNameMock' } as HSBConfig;
      platform = new HSBPlatform(
        hbLoggerMockedInstance,
        config,
        hbApiMockedInstance as unknown as API,
      );
      device = new HSBDevice(config);
      platformAccessory = new platform.api.platformAccessory(
        device.displayName,
        platform.api.hap.uuid.generate(device.serialNumber),
      );
      new HSBAccessory(platform, platformAccessory);

      expect(hbLoggerMockedInstance.error).toHaveBeenCalledTimes(1);
      expect(hbLoggerMockedInstance.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(TypeError),
      );
    });
  });

  describe(HSBAccessory.prototype['addAccessoryInformationService'].name, () => {
    beforeEach(() => {
      instantiateAccessory();
    });

    test('should get accessory information service', () => {
      expect(getServiceSpy).toHaveBeenCalledWith(platform.api.hap.Service.AccessoryInformation);
    });

    test('should set manufacturer characteristic', () => {
      expect(setAccessoryInformationCharacteristicSpy).toHaveBeenNthCalledWith(
        1,
        platform.api.hap.Characteristic.Manufacturer,
        'Homebridge.io',
      );
    });

    test('should set model characteristic', () => {
      expect(setAccessoryInformationCharacteristicSpy).toHaveBeenNthCalledWith(
        2,
        platform.api.hap.Characteristic.Model,
        PLATFORM_NAME,
      );
    });

    test('should set serialnumber characteristic', () => {
      expect(setAccessoryInformationCharacteristicSpy).toHaveBeenNthCalledWith(
        3,
        platform.api.hap.Characteristic.SerialNumber,
        platformAccessory.context.device.serialNumber,
      );
    });
  });

  describe(HSBAccessory.prototype['addShortcutsServices'].name, () => {
    beforeEach(() => {
      instantiateAccessory();
    });

    describe('if service is found in cached accessory', () => {
      test('should infer subtype based on service config', () => {
        expect(platform.api.hap.uuid.generate).toHaveBeenCalledWith(
          platform.api.hap.Service[config.serviceType] + stringify(config.services[0]),
        );
      });

      test('should retrieve cached service', () => {
        expect(getServiceByIdSpy).toHaveBeenCalledWith(
          Service[config.serviceType],
          platform.api.hap.uuid.generate(
            platform.api.hap.Service[config.serviceType] + stringify(config.services[0]),
          ),
        );
      });

      test('should not add cached service to accessory', () => {
        expect(addServiceSpy).not.toHaveBeenCalledWith(
          Service[config.serviceType],
          config.services[0].serviceName,
          platform.api.hap.uuid.generate(
            platform.api.hap.Service[config.serviceType] + stringify(config.services[0]),
          ),
        );
      });

      test('should log debug service restoration', () => {
        expect(hbLoggerMockedInstance.debug).toHaveBeenCalledWith(
          expect.any(String),
          `Service.Switch(${config.services[0].serviceName})`,
          expect.stringMatching(/restored/i),
        );
      });

      test('should instantiate new service object', () => {
        expect(serviceConstructorSpy).toHaveBeenCalledWith(
          platform.log,
          cachedService,
          config.services[0],
          platform.server,
          platform.utils,
          platform.api.hap.Characteristic,
        );
      });
    });

    describe('if service is not found in cached accessory', () => {
      test('should try to retrieve service', () => {
        expect(getServiceByIdSpy).toHaveBeenCalledWith(
          Service[config.serviceType],
          platform.api.hap.uuid.generate(
            platform.api.hap.Service[config.serviceType] + stringify(config.services[1]),
          ),
        );
      });

      test('should add service to accessory', () => {
        expect(addServiceSpy).toHaveBeenCalledWith(
          Service[config.serviceType],
          config.services[1].serviceName,
          platform.api.hap.uuid.generate(
            platform.api.hap.Service[config.serviceType] + stringify(config.services[1]),
          ),
        );
      });

      test('should log debug service creation', () => {
        expect(hbLoggerMockedInstance.debug).toHaveBeenCalledWith(
          expect.any(String),
          `Service.Switch(${config.services[1].serviceName})`,
          expect.stringMatching(/created/i),
        );
      });

      test('should instantiate new service object', () => {
        expect(serviceConstructorSpy).toHaveBeenCalledWith(
          platform.log,
          platformAccessory.getServiceById(
            Service[config.serviceType],
            platform.api.hap.uuid.generate(
              platform.api.hap.Service[config.serviceType] + stringify(config.services[1]),
            ),
          ),
          config.services[1],
          platform.server,
          platform.utils,
          platform.api.hap.Characteristic,
        );
      });
    });

    describe('if service is found in cached accessory but not in config', () => {
      test('should remove service from accessory', () => {
        expect(removeServiceSpy).toHaveBeenCalledTimes(1);
        expect(removeServiceSpy).toHaveBeenCalledWith(outdatedCachedService);
      });

      test('should log debug service removal', () => {
        expect(hbLoggerMockedInstance.debug).toHaveBeenCalledWith(
          expect.any(String),
          `Service.Switch(${outdatedCachedService.displayName})`,
          expect.stringMatching(/removed/i),
        );
      });
    });
  });
});
