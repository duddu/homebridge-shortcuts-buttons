/**
 * DO NOT EDIT MANUALLY.
 * This file was automatically generated from `/config.schema.json`.
 * Update the source schema file and run `convertSchema` to regenerate this file.
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
   * All fields below depend on this one: any value inserted in the following fields will be ignored if this one value is set to false.
   *
   * @default true
   */
  callbackServerEnabled: boolean;
  /**
   * With the default option, after the shortcut completion, a notification with the outcome of the shortcut run is displayed on the host running Homebrige.
   * If you choose to customize the callback behaviour, you have two choices: use any unix command that your host is able to execute, or just use another shortcut to handle the callback if you like. Depending on which choice you make, you'll have to fill in the next field accordingly.
   * Please consult the dedicated documentation for more detail: <a href="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/README.md#callback-command">Callback command</a>.
   *
   * @default "Default (display notification)"
   */
  callbackCommandType: 'Default (display notification)' | 'Custom unix command' | 'Shortcut name';
  /**
   * Either a unix command or the name of a shortcut to run, depending on the value selected in the previous field. In the former case, all the content of the field will be treated as a command and executed: in the latter, this field expects just the plain name of the shortcut as displayed in the Shortcuts app. If you left the previous field on the default value, any text inserted here will be ignored.
   * Please consult the dedicated documentation for more details also regarding the runtime variables available during your command/shortcut execution: <a href="https://github.com/duddu/homebridge-shortcuts-buttons/blob/latest/README.md#callback-command">Callback command</a>.
   */
  callbackCustomCommand?: string;
  /**
   * The time in milliseconds that the x-callback-url server should wait for the callback command execution to complete before timing out. Note: this matters only in case of custom callback command; if you chose a shortcut, the actual command executed is only the launch of it, the run itself is indipendent from the plugin.
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
   * A free port number to be used by the internal x-callback-url http server.
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
