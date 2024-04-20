import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { ShortcutsButtonsPlatform } from './platform';

export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, ShortcutsButtonsPlatform);
};

// TODO: freeze everything

// TODO: validate config (services different names)
