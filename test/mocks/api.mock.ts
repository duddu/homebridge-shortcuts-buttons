import { jest } from '@jest/globals';
import { EventEmitter } from 'events';
import { Accessory, Characteristic, Service } from 'hap-nodejs';
import { generate } from 'hap-nodejs/dist/lib/util/uuid';

import { HSBAccessoryContext, HSBDevice, HSBPlatformAccessory } from '../../src/accessory';
import { HSBConfig } from '../../src/config';

class HSBPlatformAccessoryMock extends Accessory implements HSBPlatformAccessory {
  _associatedHAPAccessory: Accessory;
  context: HSBAccessoryContext;

  constructor(displayName: string, uuid: string) {
    hbApiMockedPlatformAccessoryConstructorSpy(displayName, uuid);
    super(displayName, uuid);
    this._associatedHAPAccessory = this;
    this.context = {
      device: new HSBDevice({ accessoryName: displayName } as HSBConfig),
    } as HSBAccessoryContext;
  }

  override emit = jest.fn<(event: unknown, port?: unknown, address?: unknown) => true>();

  updateDisplayName(): void {
    throw new Error(`Method "${this.updateDisplayName.name}" not implemented`);
  }
}

export const hbApiMockedPlatformAccessoryConstructorSpy = jest.fn();

class HBApiMock extends EventEmitter {
  public updatePlatformAccessories = jest.fn();

  public registerPlatformAccessories = jest.fn();

  public platformAccessory = HSBPlatformAccessoryMock;

  public readonly hap = {
    uuid: {
      generate: jest.fn(generate),
    },
    Service,
    Characteristic,
  };
}

export const hbApiMockedInstance = new HBApiMock();
