import { jest } from '@jest/globals';
import EventEmitter from 'events';
import { Characteristic } from 'hap-nodejs/dist/lib/Characteristic';
import { Service } from 'hap-nodejs/dist/lib/Service';
import { generate } from 'hap-nodejs/dist/lib/util/uuid';
import { PlatformAccessory } from 'homebridge/lib/platformAccessory';

import { HSBAccessoryContext } from '../../src/accessory';

export const hbApiMockedPlatformAccessoryConstructorSpy = jest.fn();

class HBApiMock extends EventEmitter {
  public updatePlatformAccessories = jest.fn();
  public registerPlatformAccessories = jest.fn();

  public platformAccessory = class extends PlatformAccessory<HSBAccessoryContext> {
    constructor(displayName: string, uuid: string) {
      hbApiMockedPlatformAccessoryConstructorSpy(displayName, uuid);
      super(displayName, uuid, undefined);
    }
  };

  public readonly hap = {
    uuid: {
      generate: jest.fn(generate),
    },
    Service,
    Characteristic,
  };
}

export const hbApiMockedInstance = new HBApiMock();
