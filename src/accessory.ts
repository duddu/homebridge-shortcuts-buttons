import { PlatformAccessory, Service, WithUUID } from 'homebridge';

import { HSBPlatform } from './platform';
import { HSBService, HSBServiceConfig } from './service';
import { PLATFORM_NAME } from './settings';

export interface HSBDevice {
  displayName: string;
  serialNumber: string;
}

export interface HSBAccessoryContext {
  device: HSBDevice;
}

export type HSBPlatformAccessory = PlatformAccessory<HSBAccessoryContext>;

export class HSBAccessory {
  constructor(
    private readonly platform: HSBPlatform,
    private readonly accessory: HSBPlatformAccessory,
  ) {
    this.getOrAddService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Homebridge.io')
      .setCharacteristic(this.platform.Characteristic.Model, PLATFORM_NAME)
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.accessory.context.device.serialNumber,
      );

    for (const serviceConfig of this.platform.config.services) {
      new HSBService(
        this.platform.log,
        this.getOrAddService(this.platform.Service.Outlet, serviceConfig),
        serviceConfig,
        this.platform.server,
        this.platform.utils,
        this.platform.Characteristic,
      );
    }
  }

  private getOrAddService<T extends WithUUID<typeof Service>>(
    type: T | Service,
    config?: HSBServiceConfig,
  ): Service {
    if (typeof config?.name !== 'string') {
      return this.accessory.getService(type as T) || this.accessory.addService(type as Service);
    }

    // @TODO this.accessory.removeService(this.accessory.services[])
    return (
      this.accessory.getService(config.name) ||
      this.accessory.addService(
        type as typeof Service,
        config.name,
        this.platform.api.hap.uuid.generate(this.accessory.UUID + JSON.stringify(config)),
      )
    );
  }
}
