import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Characteristic as TCharacteristic, Service } from 'homebridge';

import { HSBService, HSBServiceConfig } from '../src/service';
import { HSBShortcut } from '../src/shortcut';

import { hbLoggerMockedInstance } from './mocks/logger.mock';
import { xCallbackUrlServerMockedInstance } from './mocks/server.mock';
import { utilsMockedInstance } from './mocks/utils.mock';

jest.mock('../src/shortcut');

describe(HSBService.name, () => {
  let serviceMock: Service;
  let serviceConfigMock: HSBServiceConfig;
  let characteristicMock: typeof TCharacteristic;
  let service: HSBService;

  beforeEach(() => {
    serviceMock = {
      setCharacteristic: jest.fn().mockReturnThis(),
      getCharacteristic: jest.fn().mockReturnValue({
        onGet: jest.fn().mockReturnThis(),
        onSet: jest.fn().mockReturnThis(),
      }),
      updateCharacteristic: jest.fn(),
      displayName: 'Test Service',
    } as unknown as Service;

    serviceConfigMock = {
      serviceName: 'Test Service',
      shortcutName: 'Test Shortcut',
    } as unknown as HSBServiceConfig;

    characteristicMock = {
      Name: 'Name',
      ConfiguredName: 'ConfiguredName',
      On: 'On',
    } as unknown as typeof TCharacteristic;

    service = new HSBService(
      hbLoggerMockedInstance,
      serviceMock,
      serviceConfigMock,
      xCallbackUrlServerMockedInstance,
      utilsMockedInstance,
      characteristicMock,
    );
  });

  describe('constructor', () => {
    test(`should initialize ${HSBService.name} correctly`, () => {
      expect(service['state'].isOn).toBe(false);
      expect(serviceMock.setCharacteristic).toHaveBeenCalledWith(
        characteristicMock.Name,
        serviceConfigMock.serviceName,
      );
      expect(serviceMock.setCharacteristic).toHaveBeenCalledWith(
        characteristicMock.ConfiguredName,
        serviceConfigMock.serviceName,
      );
      expect(serviceMock.getCharacteristic).toHaveBeenCalledWith(characteristicMock.On);
    });
  });

  describe(HSBService.prototype['getOn'].name, () => {
    test('should return the current state value', async () => {
      service['state'].isOn = true;
      const result = await service['getOn']();

      expect(result).toBe(true);
      expect(hbLoggerMockedInstance.debug).toHaveBeenCalledWith(
        'Service(Test Service)::getOn',
        'Value=true',
      );
    });
  });

  describe(HSBService.prototype['setOn'].name, () => {
    test('should handle setting state to false when already false', async () => {
      jest.useFakeTimers();

      service['state'].isOn = false;
      await service['setOn'](false);
      jest.runAllTicks();
      jest.runAllTimers();

      expect(hbLoggerMockedInstance.debug).toHaveBeenCalledWith(
        'Service(Test Service)::setOn',
        'Value=false',
      );
      expect(hbLoggerMockedInstance.debug).toHaveBeenCalledWith(
        'Service(Test Service)::setOn',
        'State value was already false, skipping handler',
      );
      expect(service['state'].isOn).toBe(false);
    });

    test('should handle setting state to true', async () => {
      service['state'].isOn = false;
      await service['setOn'](true);

      expect(service['state'].isOn).toBe(true);
      expect(HSBShortcut.prototype.run).toHaveBeenCalled();
      expect(hbLoggerMockedInstance.success).toHaveBeenCalledWith(
        'Service(Test Service)::setOn Shortcut(Test Shortcut)::run Executed successfully',
      );
    });

    test('should handle shortcut run failure', async () => {
      service['state'].isOn = false;
      (HSBShortcut.prototype.run as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test Error');
      });
      await service['setOn'](true);

      expect(hbLoggerMockedInstance.error).toHaveBeenCalledWith(
        'Service(Test Service)::setOn Shortcut(Test Shortcut)::run Execution failed',
        expect.any(Error),
      );
    });
  });

  describe('toggleBackOffTimeout', () => {
    test('should set the timeout and reset state', () => {
      jest.useFakeTimers();
      service['toggleBackOffTimeout'].set();
      jest.advanceTimersByTime(650);

      expect(service['state'].isOn).toBe(false);
      expect(serviceMock.updateCharacteristic).toHaveBeenCalledWith(characteristicMock.On, false);
      expect(hbLoggerMockedInstance.debug).toHaveBeenCalledWith(
        'Service(Test Service)::setOn',
        'Characteristic value set back to false',
      );
    });
  });
});
