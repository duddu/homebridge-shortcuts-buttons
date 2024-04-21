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

export interface HSBConfig extends Pick<PlatformConfig, 'platform' | '_bridge'> {
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
     * By default (field left empty), after the Shortcut completes, a notification is shown on the host running Homebrige, and a relevant sound effect ("Glass" for success, "Sosumi" for failure) is played.
     *
     * If any value is present in this field, after the Apple Shortcut completes the service will treat this value as a unix command and will try to run it via node `child_process.exec` (unsanitised, at your own risk).
     * In your command you have at your disposal the following environment variables:
     * - SHORTCUT_NAME: string
     * - SHORTCUT_RESULT: "success" | "error" | "cancel"
     */
    callbackCustomCommand?: string;
  };
}
