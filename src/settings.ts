import { displayName, name } from './../package.json';

/**
 * This is the name of the platform that users will use to register the plugin in the
 * Homebridge config.json
 */
export const PLATFORM_NAME = displayName.replace(/\s/g, '');

/**
 * This must match the name of your plugin as defined the package.json
 */
export const PLUGIN_NAME = name;

/**
 * This plugin uses a single device just as a wrapper for the buttons services
 */
export const DEVICE_SERIAL = '634EA867A81D59F1898';
