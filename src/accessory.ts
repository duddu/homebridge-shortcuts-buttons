import { PlatformAccessory } from 'homebridge';

import { HSBPlatform } from './platform';
import { HSBService, HSBServiceType } from './service';
import { PLATFORM_NAME } from './settings';
import { HSBConfig } from './config';

export type HSBPlatformAccessory = PlatformAccessory<HSBAccessoryContext>;

export interface HSBAccessoryContext {
  device: HSBDevice;
}

export class HSBAccessory {
  private readonly serviceType: HSBServiceType;

  constructor(
    private readonly platform: HSBPlatform,
    private readonly accessory: HSBPlatformAccessory,
  ) {
    this.serviceType = this.getShortcutButtonServiceType();

    this.addAccessoryInformationService();
    this.addShortcutButtonServices();
  }

  private addAccessoryInformationService() {
    (
      this.accessory.getService(this.platform.Service.AccessoryInformation) ??
      this.accessory.addService(this.platform.Service.AccessoryInformation)
    )
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Homebridge.io')
      .setCharacteristic(this.platform.Characteristic.Model, PLATFORM_NAME)
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.accessory.context.device.serialNumber,
      );
  }

  private addShortcutButtonServices() {
    for (const serviceConfig of this.platform.config.services) {
      const subtype = this.platform.api.hap.uuid.generate(JSON.stringify(serviceConfig));

      let service = this.accessory.getServiceById(this.serviceType, subtype);
      let logServiceOrigin: string = 'Restored from cache';
      if (!service) {
        service = this.accessory.addService(this.serviceType, serviceConfig.name, subtype);
        logServiceOrigin = 'Created from fresh config';
      }
      this.platform.log.debug(
        'Accessory::addShortcutButtonServices',
        `Service(${service.displayName})`,
        logServiceOrigin,
      );

      new HSBService(
        this.platform.log,
        service,
        serviceConfig,
        this.platform.server,
        this.platform.utils,
        this.platform.Characteristic,
      );
    }
  }

  private getShortcutButtonServiceType(): HSBServiceType {
    switch (this.platform.config.serviceType) {
      case 'Outlet':
        return this.platform.Service.Outlet;
      case 'Switch':
        return this.platform.Service.Switch;
      default:
        return this.platform.Service.Outlet;
    }
  }
}

export class HSBDevice {
  constructor(private readonly config: HSBConfig) {}

  public readonly serialNumber = '634EA867A81D59F1898';

  public get displayName(): string {
    return this.config.accessoryName;
  }
}
