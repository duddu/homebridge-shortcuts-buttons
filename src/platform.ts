import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformConfig,
  Service,
  Characteristic,
  Nullable,
} from 'homebridge';

import { ShortcutsButtonsUserConfig } from './config';
import { DEVICE_SERIAL, PLATFORM_NAME, PLUGIN_NAME } from './settings';
import {
  ShortcutsButtonsAccessory,
  ShortcutsButtonsPlatformAccessory,
  ShortcutsButtonsAccessoryContext,
  ShortcutsButtonsAccessoryDevice,
} from './accessory';
import { XCallbackUrlServer } from './server';
import { ShortcutsButtonsUtils } from './utils';

export type ShortcutsButtonsPlatformConfig = PlatformConfig & ShortcutsButtonsUserConfig;

export class ShortcutsButtonsPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly config: ShortcutsButtonsPlatformConfig;
  public readonly utils: ShortcutsButtonsUtils;

  public accessory: Nullable<ShortcutsButtonsPlatformAccessory> = null;
  public serverBaseUrl: Nullable<string> = null;

  constructor(
    public readonly log: Logger,
    _config: PlatformConfig,
    public readonly api: API,
  ) {
    this.config = _config as ShortcutsButtonsPlatformConfig;
    this.utils = new ShortcutsButtonsUtils(log);
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');

      const { baseUrl } = new XCallbackUrlServer(this.accessory, this.config, log, this.utils, api);
      this.serverBaseUrl = baseUrl;

      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: ShortcutsButtonsPlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already
    // been registered
    this.accessory = accessory;
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {
    // generate a unique id for the accessory this should be generated from
    // something globally unique, but constant, for example, the device serial
    // number or MAC address
    const uuid = this.api.hap.uuid.generate(this.device.serialNumber);

    // see if an accessory with the same uuid has already been registered and restored from
    // the cached devices we stored in the `configureAccessory` method above
    if (this.accessory?.UUID === uuid) {
      // the accessory already exists
      this.log.info('Restoring existing accessory from cache:', this.accessory.displayName);

      if (this.accessory.displayName !== this.device.displayName) {
        this.log.info('Update existing accessory display name to:', this.device.displayName);

        this.accessory.displayName = this.device.displayName;
        this.accessory.context.device.displayName = this.device.displayName;
        this.api.updatePlatformAccessories([this.accessory]);
      }

      // create the accessory handler for the restored accessory
      // this is imported from `platformAccessory.ts`
      new ShortcutsButtonsAccessory(this, this.accessory);

      // it is possible to remove platform accessories at any time using
      // `api.unregisterPlatformAccessories`, eg.:
      // remove platform accessories when no longer present
      // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
      // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
    } else {
      // the accessory does not yet exist, so we need to create it
      this.log.info('Adding new accessory:', this.device.displayName);

      // create a new accessory
      const accessory = new this.api.platformAccessory<ShortcutsButtonsAccessoryContext>(
        this.device.displayName,
        uuid,
      );

      // store a copy of the device object in the `accessory.context`
      // the `context` property can be used to store any data about the accessory you may need
      accessory.context.device = this.device;

      // create the accessory handler for the newly create accessory
      // this is imported from `platformAccessory.ts`
      new ShortcutsButtonsAccessory(this, accessory);

      // link the accessory to your platform
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

      this.accessory = accessory;
    }
  }

  private get device(): ShortcutsButtonsAccessoryDevice {
    return {
      displayName: this.config.accessoryName,
      serialNumber: DEVICE_SERIAL,
    };
  }
}
