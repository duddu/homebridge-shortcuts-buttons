import { API } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { HSBPlatform } from './platform.js';

export default (api: API) => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, HSBPlatform);
};
