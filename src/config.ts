/**
 * DO NOT EDIT MANUALLY.
 * This file was automatically generated from `/config.schema.json`.
 * Update the source schema file and run `schema2ts` to regenerate this file.
 */

/* eslint-disable max-len */

import { PlatformConfig } from 'homebridge';

export interface HSBConfig extends Pick<PlatformConfig, '_bridge' | 'platform'> {
  /**
   * Name of the platform bridge.
   *
   * @default "Homebridge Shortcuts Buttons"
   */
  name: string;
  /**
   * Display name of the accessory.
   *
   * @default "Shortcuts"
   */
  accessoryName: string;
  /**
   * Display the buttons services as outlets or as switches.
   *
   * @default "Outlet"
   */
  serviceType: 'Outlet' | 'Switch';
  /**
   * List of buttons configuration objects.
   *
   * @minItems 1
   */
  services: {
    /**
     * A name to display for this button.
     */
    serviceName: string;
    /**
     * Name of the Apple Shortcut to trigger, as displayed in the Shortcuts app. The machine running Homebridge must have access to it (i.e. be logged to the correct iCloud account).
     */
    shortcutName: string;
  }[];
  /**
   * Whether the plugin should execute a command once a shortcut run completes. This determines whether to run an internal x-callback-url http server in the background.
   * All fields below depend on this one: any value inserted in the following inputs will be ignored if this one field is set to false.
   *
   * @default true
   */
  callbackServerEnabled: boolean;
  /**
   * IP address or hostname to expose the internal x-callback-url http server (must be accessible from a browser on the machine running Homebridge).
   *
   * @default "127.0.0.1"
   */
  callbackServerHostname: string;
  /**
   * A free port number to be used by the internal x-callback-url http server.
   *
   * @default 63963
   */
  callbackServerPort: number;
  /**
   * By default, after the shortcut completion, a notification with a brief summary is displayed on the host running Homebrige (with sound effect 'Glass' for success and 'Sosumi' for failure).
   *
   * If you input any value here it will be treated as a unix command and executed via node's `child_process.exec` (at your own risk).
   * In your command you have at your disposal the following environment variables:
   * - SHORTCUT_NAME: string
   * - SHORTCUT_RESULT: "success" | "error" | "cancel"
   */
  callbackCustomCommand?: string;
  /**
   * The time in milliseconds that the x-callback-url server should wait for the callback command execution to complete before timing out.
   *
   * @default 5000
   */
  callbackCommandTimeout: number;
}
