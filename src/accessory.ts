import { PlatformAccessory, Service, WithUUID } from 'homebridge';

import { ShortcutsButtonsPlatform } from './platform';
import { ShortcutsButtonsAccessoryService, ShortcutsButtonsPlatformServiceConfig } from './service';
import { PLATFORM_NAME } from './settings';

export interface ShortcutsButtonsAccessoryDevice {
  displayName: string;
  serialNumber: string;
}

export interface ShortcutsButtonsAccessoryContext {
  device: ShortcutsButtonsAccessoryDevice;
}

export type ShortcutsButtonsPlatformAccessory = PlatformAccessory<ShortcutsButtonsAccessoryContext>;

export class ShortcutsButtonsAccessory {
  constructor(
    private readonly platform: ShortcutsButtonsPlatform,
    private readonly accessory: ShortcutsButtonsPlatformAccessory,
  ) {
    this.getOrAddService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(this.platform.Characteristic.Manufacturer, PLATFORM_NAME)
      .setCharacteristic(
        this.platform.Characteristic.Model,
        this.accessory.context.device.displayName,
      )
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.accessory.context.device.serialNumber,
      );

    for (const serviceConfig of this.platform.config.buttons) {
      new ShortcutsButtonsAccessoryService(
        this.platform.log,
        this.getOrAddService(this.platform.Service.Outlet, serviceConfig),
        serviceConfig,
        this.platform.utils,
        this.platform.serverBaseUrl,
        this.platform.Characteristic,
      );
    }
  }

  private getOrAddService<T extends WithUUID<typeof Service>>(
    type: T | Service,
    config?: ShortcutsButtonsPlatformServiceConfig,
  ): Service {
    if (typeof config?.name !== 'string') {
      return this.accessory.getService(type as T) || this.accessory.addService(type as Service);
    }

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
