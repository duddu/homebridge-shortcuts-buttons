import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformConfig,
  Service,
  Characteristic,
  Nullable,
} from 'homebridge';

import { HSBConfig } from './config';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { HSBAccessory, HSBPlatformAccessory, HSBAccessoryContext, HSBDevice } from './accessory';
import { HSBXCallbackUrlServer } from './server';
import { HSBUtils } from './utils';

export class HSBPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly config: HSBConfig;
  public readonly utils: HSBUtils;
  private readonly device: HSBDevice;

  public accessory: Nullable<HSBPlatformAccessory> = null;
  public server: Nullable<HSBXCallbackUrlServer> = null;

  constructor(
    public readonly log: Logger,
    _config: PlatformConfig,
    public readonly api: API,
  ) {
    this.config = _config as HSBConfig;
    this.device = new HSBDevice(this.config);
    this.utils = new HSBUtils(log);
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    this.log.debug('Finished initializing platform:', this.config.name);

    // Homebridge 1.8.0 introduced a `log.success` method that can be used to log success messages
    // For users that are on a version prior to 1.8.0, we need a 'polyfill' for this method
    !log.success && (log.success = log.info);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');

      if (this.config.waitForShortcutResult === true) {
        this.server = new HSBXCallbackUrlServer(this.config, log, this.utils, api);
      }

      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: HSBPlatformAccessory) {
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
        this.accessory.context.device = this.device;
        this.api.updatePlatformAccessories([this.accessory]);
      }

      // create the accessory handler for the restored accessory
      // this is imported from `platformAccessory.ts`
      new HSBAccessory(this, this.accessory);

      // it is possible to remove platform accessories at any time using
      // `api.unregisterPlatformAccessories`, eg.:
      // remove platform accessories when no longer present
      // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
      // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
    } else {
      // the accessory does not yet exist, so we need to create it
      this.log.info('Adding new accessory:', this.device.displayName);

      // create a new accessory
      const accessory = new this.api.platformAccessory<HSBAccessoryContext>(
        this.device.displayName,
        uuid,
      );

      // store a copy of the device object in the `accessory.context`
      // the `context` property can be used to store any data about the accessory you may need
      accessory.context.device = this.device;

      // create the accessory handler for the newly create accessory
      // this is imported from `platformAccessory.ts`
      new HSBAccessory(this, accessory);

      // link the accessory to your platform
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

      this.accessory = accessory;
    }
  }
}
