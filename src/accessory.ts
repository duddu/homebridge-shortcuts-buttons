import { PlatformAccessory, Service, WithUUID } from 'homebridge';

import { ShortcutsButtonsPlatform } from './platform';
import {
  ShortcutsButtonsAccessoryService,
  ShortcutsButtonsPlatformServiceConfig,
} from './service';

export interface ShortcutsButtonsAccessoryContext {
  device: {
    uniqueId: string;
    displayName: string;
  };
}

export type ShortcutsButtonsPlatformAccessory =
  PlatformAccessory<ShortcutsButtonsAccessoryContext>;

export class ShortcutsButtonsAccessory {
  private getOrAddService<T extends WithUUID<typeof Service>>(
    type: T | Service,
    config?: ShortcutsButtonsPlatformServiceConfig,
  ): Service {
    if (typeof config?.name !== 'string') {
      return (
        this.accessory.getService(type as T) ||
        this.accessory.addService(type as Service)
      );
    }

    return (
      this.accessory.getService(config.name) ||
      this.accessory.addService(
        type as typeof Service,
        config.name,
        this.platform.api.hap.uuid.generate(
          this.accessory.UUID + JSON.stringify(config),
        ),
      )
    );
  }

  constructor(
    private readonly platform: ShortcutsButtonsPlatform,
    private readonly accessory: ShortcutsButtonsPlatformAccessory,
  ) {
    this.getOrAddService(this.platform.Service.AccessoryInformation)
      // @TODO real values
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        'Default-Manufacturer',
      )
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        'Default-Serial',
      );

    for (const buttonConfig of this.platform.config.buttons) {
      new ShortcutsButtonsAccessoryService(
        this.platform,
        this.getOrAddService(this.platform.Service.Outlet, buttonConfig),
        buttonConfig,
      );
    }
  }
}
