/**
 * DO NOT EDIT MANUALLY.
 * This file was automatically generated from `/config.schema.json`.
 * Update the source schema file and run `schema2ts` to regenerate this file.
 */

/* eslint-disable max-len */

export interface ShortcutsButtonsUserConfig {
  /**
   * Name of the platform bridge.
   */
  name: string;
  /**
   * Display name of the accessory.
   */
  accessoryName: string;
  /**
   * Display the buttons services as outlets or as switches.
   */
  displayButtonsAs: 'Outlet' | 'Switch';
  /**
   * List of buttons configuration objects.
   *
   * @minItems 1
   */
  buttons: {
    /**
     * Display name of the button.
     */
    name: string;
    /**
     * Name of the Apple Shortcut to trigger (without extension).
     */
    shortcut: string;
  }[];
  /**
   * Wait for the triggered Shortcut to complete to invoke a callback.
   */
  waitForShortcutResult: boolean;
  /**
   * All values in this section are ignored if `waitForShortcutResult` is off.
   */
  shortcutResultCallback: {
    /**
     * IP address (or hostname) and port where the server handling the x-callback-url will be exposed.
     */
    callbackServerHost?: string;
    /**
     * @TODO? Seconds to wait for the triggered Shortcut to produce a result before timing out.
     */
    waitUntilSeconds?: number;
    /**
     * By default (field left empty), after the Shortcut completes, a notification is shown on the host running Homebrige, and a relevant sound effect ("Glass" for success, "Sosumi" for failure) is played.
     *
     * If any value is present in this field, after the Apple Shortcut completes the service will treat this value as a unix command and will try to run it via node `child_process.exec` (at your own risk).
     * In your command you have at your disposal the following environment variables:
     * - SHORTCUT_NAME: string
     * - SHORTCUT_RESULT: "success" | "error" | "cancel"
     */
    callbackCustomCommand?: string;
  };
}
