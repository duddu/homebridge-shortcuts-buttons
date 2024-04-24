/**
 * DO NOT EDIT MANUALLY.
 * This file was automatically generated from `/config.schema.json`.
 * Update the source schema file and run `schema2ts` to regenerate this file.
 */

/* eslint-disable max-len */

import { PlatformConfig } from 'homebridge';

/**
 * Display the buttons services as outlets or as switches.
 */
type DisplayButtonsAs = 'Outlet' | 'Switch';
/**
 * List of buttons configuration objects.
 *
 * @minItems 1
 */
type Buttons = {
  /**
   * Display name of the button.
   */
  name: string;
  /**
   * Name of the Apple Shortcut to trigger, as displayed in the Shortcuts app. The machine running Homebridge must have access to it (i.e. be logged to the correct iCloud account).
   */
  shortcut: string;
}[];

export interface HSBConfig extends Pick<PlatformConfig, '_bridge' | 'platform'> {
  /**
   * Name of the platform bridge.
   */
  name: string;
  /**
   * Display name of the accessory.
   */
  accessoryName: string;
  serviceType: DisplayButtonsAs;
  services: Buttons;
  /**
   * Wait for the triggered Shortcut to complete to invoke a callback.
   */
  waitForShortcutResult: boolean;
  /**
   * All fields in the following section are relevant to the x-callback-url server, thus will be ignored in case `Wait For Shortcut Result` is toggled off.
   */
  shortcutResultCallback: {
    /**
     * IP address or hostname to expose the internal x-callback-url server (i.e. must be accessible from a browser).
     */
    callbackServerHostname: string;
    /**
     * Available port number to run the internal x-callback-url server.
     */
    callbackServerPort: number;
    /**
     * By default, after the shortcut completes, a notification with a brief summary is displayed on the host running Homebrige (with sound effect 'Glass' for success and 'Sosumi' for failure).
     *
     * If you input any value in this field, it will be treated as a unix command and executed via node's `child_process.exec` (at your own risk).
     * In your command you have at your disposal the following environment variables:
     * - SHORTCUT_NAME: string
     * - SHORTCUT_RESULT: "success" | "error" | "cancel"
     */
    callbackCustomCommand?: string;
    /**
     * The time in milliseconds that the x-callback-url server should wait for the callback command execution to complete before timing out.
     */
    callbackCommandTimeout: number;
  };
}
