import { PlatformAccessory } from 'homebridge';

import { HSBPlatform } from './platform';
import { HSBService } from './service';
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
    const serviceType = this.shortcutButtonServiceType;

    for (const serviceConfig of this.platform.config.services) {
      const subtype = this.platform.api.hap.uuid.generate(JSON.stringify(serviceConfig));

      const service =
        this.accessory.getServiceById(serviceType, subtype) ??
        this.accessory.addService(serviceType, serviceConfig.name, subtype);

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

  private get shortcutButtonServiceType():
    | typeof this.platform.Service.Outlet
    | typeof this.platform.Service.Switch {
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
