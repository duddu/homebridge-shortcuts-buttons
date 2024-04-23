import { Characteristic, CharacteristicValue, Logger, Nullable, Service } from 'homebridge';

import { Shortcut } from './shortcut';
import { HSBUtils } from './utils';
import { HSBServer } from './server';
import { HSBConfig } from './config';
import { HSBXCallbackUrlServer } from './server';
import { HSBShortcut } from './shortcut';
import { HSBUtils } from './utils';

export type HSBServiceConfig = HSBConfig['services'][number];

class HSBServiceState {
  isOn: boolean = false;
}

export class HSBService {
  private readonly state: HSBServiceState;
  private readonly shortcut: HSBShortcut;

  constructor(
    private readonly log: Logger,
    private readonly service: Service,
    private readonly serviceConfig: HSBServiceConfig,
    server: Nullable<HSBXCallbackUrlServer>,
    utils: HSBUtils,
    _Characteristic: typeof Characteristic,
  ) {
    this.state = new HSBServiceState();
    this.shortcut = new HSBShortcut(serviceConfig.shortcut, server, utils);
    this.service
      .setCharacteristic(_Characteristic.Name, serviceConfig.name)
      .setCharacteristic(_Characteristic.ConfiguredName, serviceConfig.name)
      .getCharacteristic(_Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));

    this.state = new HSBServiceState();
    this.shortcut = new Shortcut(serviceConfig.shortcut, server, utils);
  }

  private async getOn(): Promise<CharacteristicValue> {
    const isOn = this.state.isOn;

    this.log.debug(`Get Characteristic On for ${this.service.displayName} ->`, isOn);

    return isOn;
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    if (value === false) {
      return;
    }

    this.state.isOn = true;

    this.log.debug(`Set Characteristic On for button ${this.service.displayName} ->`, value);

    try {
      await this.shortcut.run();
    } catch (e) {
      this.log.error(`Unable to run shortcut named ${this.serviceConfig.shortcut}`, e);
    }

    this.state.isOn = false;
  }
}
