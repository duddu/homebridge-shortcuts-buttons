/**
 * DO NOT EDIT MANUALLY.
 * This file was automatically generated from `/config.schema.json`.
 * Update the source schema file and run `convertSchema` to regenerate this file.
 */

/* eslint-disable max-len */

import { PlatformConfig } from 'homebridge';

export interface HSBConfig extends Pick<PlatformConfig, '_bridge' | 'platform'> {
  /**
   * Display name of the platform bridge.
   *
   * @default "ShortcutsButtons"
   */
  name: string;
  /**
   * Display name of the platform accessory.
   *
   * @default "Shortcuts"
   */
  accessoryName: string;
  /**
   * Display the shortcuts buttons as Outlets or as Switches. See the <a href="https://github.com/duddu/homebridge-shortcuts-buttons/tree/latest?tab=readme-ov-file#how-does-it-look-like">related documentation</a> for a visual preview of the two options in the Apple Home app.
   *
   * @default "Outlet"
   */
  serviceType: 'Outlet' | 'Switch';
  /**
   * Add a new item to this list for every Apple Shortcut you want to be able to launch.
   * The machine running Homebridge must have access to every shortcut listed here (i.e. the macOS user must be logged into the iCloud account where the shortcuts are stored). If you change the name of a shortcut from the Shortcuts app remember to update it here too.
   *
   * @minItems 1
   */
  services: {
    /**
     * A title to display for this button.
     */
    serviceName: string;
    /**
     * The name of the Apple Shortcut to launch, as displayed in your Shortcuts app.
     */
    shortcutName: string;
  }[];
  /**
   * The plugin will wait for the shortcut to complete its run, and will execute a callback action of your choice.
   *
   * @default true
   */
  callbackServerEnabled: boolean;
  /**
   * With the default option, after the shortcut completion, a notification with the outcome of the shortcut run is displayed on the host running Homebrige.
   * If you choose to customize the callback behaviour, you have two choices: use any unix command that your host is able to execute, or just use another shortcut to handle the callback if you like. Depending on your choice, you must complete the next field accordingly.
   * Please see the <a href="https://github.com/duddu/homebridge-shortcuts-buttons/tree/latest?tab=readme-ov-file#callback-command">related documentation</a> for more detail.
   *
   * @default "Default (display notification)"
   */
  callbackCommandType: 'Default (display notification)' | 'Custom unix command' | 'Shortcut name';
  /**
   * Either a unix command or the name of a shortcut to run, depending on the value selected in the previous field. In the former case, all the content of the field will be treated as a command and executed: in the latter, this field expects just the plain name of the shortcut as displayed in the Shortcuts app. If you left the previous field on the default value, any text inserted here will be ignored.
   * You can also read input parameters from your custom command/shortcut. Please see the <a href="https://github.com/duddu/homebridge-shortcuts-buttons/tree/latest?tab=readme-ov-file#custom-unix-command">related documentation</a> for more detail.
   */
  callbackCustomCommand?: string;
  /**
   * The time in milliseconds that the x-callback-url server should wait for the callback command execution to complete before timing out.
   *
   * @default 5000
   */
  callbackCommandTimeout: number;
  /**
   * IPv4 address or hostname to expose the internal x-callback-url http server (must be accessible from a browser on the machine running Homebridge).
   *
   * @default "127.0.0.1"
   */
  callbackServerHostname: string;
  /**
   * A free port number for the internal x-callback-url HTTP server.
   *
   * @default 63963
   */
  callbackServerPort: number;
  /**
   * If you access other Homebridge services (e.g. UI) behind a reverse proxy with TLS certificate installed, you may want to access the x-callback-url server via https as well.
   *
   * @default "http"
   */
  callbackServerProtocol: 'http' | 'https';
}
