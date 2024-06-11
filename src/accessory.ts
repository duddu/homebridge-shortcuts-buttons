import stringify from 'fast-json-stable-stringify';
import { PlatformAccessory } from 'homebridge';

import { HSBConfig } from './config';
import { HSBPlatform } from './platform';
import { HSBService, HSBServiceType } from './service';
import { PLATFORM_NAME } from './settings';

export interface HSBAccessoryContext {
  device: HSBDevice;
}

export type HSBPlatformAccessory = PlatformAccessory<HSBAccessoryContext>;

export class HSBAccessory {
  constructor(
    private readonly platform: HSBPlatform,
    private readonly platformAccessory: HSBPlatformAccessory,
  ) {
    try {
      this.addAccessoryInformationService();
      this.addShortcutsServices();
    } catch (e) {
      platform.log.error('HSBAccessory::constructor', e);
    }
  }

  private addAccessoryInformationService() {
    this.platformAccessory
      .getService(this.platform.api.hap.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, 'Homebridge.io')
      .setCharacteristic(this.platform.api.hap.Characteristic.Model, PLATFORM_NAME)
      .setCharacteristic(
        this.platform.api.hap.Characteristic.SerialNumber,
        this.platformAccessory.context.device.serialNumber,
      );
  }

  private addShortcutsServices() {
    const serviceType: HSBServiceType =
      this.platform.api.hap.Service[this.platform.config.serviceType];
    const activeServicesSubtypes: Set<string | undefined> = new Set();

    for (const serviceConfig of this.platform.config.services) {
      const subtype = this.platform.api.hap.uuid.generate(serviceType + stringify(serviceConfig));

      let service = this.platformAccessory.getServiceById(serviceType, subtype);
      let logServiceOrigin = 'Restored from cache';

      if (!service) {
        service = this.platformAccessory.addService(
          serviceType,
          serviceConfig.serviceName,
          subtype,
        );
        logServiceOrigin = 'Created from fresh config';
      }

      this.platform.log.debug(
        'Accessory::addShortcutsServices',
        `Service.${serviceType.name}(${service.displayName})`,
        logServiceOrigin,
      );

      activeServicesSubtypes.add(service.subtype);

      new HSBService(
        this.platform.log,
        service,
        serviceConfig,
        this.platform.server,
        this.platform.utils,
        this.platform.api.hap.Characteristic,
      );
    }

    const servicesToRemove = this.platformAccessory.services.filter(
      ({ subtype }) => typeof subtype === 'string' && !activeServicesSubtypes.has(subtype),
    );

    for (const service of servicesToRemove) {
      this.platformAccessory.removeService(service);

      this.platform.log.debug(
        'Accessory::addShortcutsServices',
        `Service.${this.platform.api.hap.Service.serialize(service).constructorName}` +
          `(${service.displayName})`,
        'Removed as outdated',
      );
    }

    if (servicesToRemove.length > 0) {
      this.platform.api.updatePlatformAccessories([this.platformAccessory]);

      this.platform.log.debug(
        'Accessory::addShortcutsServices',
        'Requested platform accessory update',
      );
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
