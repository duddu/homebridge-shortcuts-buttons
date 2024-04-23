import {
  Characteristic as TCharacteristic,
  CharacteristicValue,
  Logger,
  Nullable,
  Service,
} from 'homebridge';

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
    private readonly Characteristic: typeof TCharacteristic,
  ) {
    this.state = new HSBServiceState();
    this.shortcut = new HSBShortcut(serviceConfig.shortcut, server, utils);

    this.service
      .setCharacteristic(Characteristic.Name, serviceConfig.name)
      .setCharacteristic(Characteristic.ConfiguredName, serviceConfig.name)
      .getCharacteristic(Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));
  }

  private async getOn(): Promise<CharacteristicValue> {
    const isOn = this.state.isOn;

    this.log.debug(`Service(${this.service.displayName}):On:onGet`, `value=${isOn}`);

    return isOn;
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    const logHandlerContext = `Service(${this.service.displayName}):On:onSet`;
    const logShortcutContext = `${logHandlerContext} Shortcut(${this.serviceConfig.shortcut})`;
    this.log.debug(logHandlerContext, `value=${value}`);

    if (value === false) {
      if (this.state.isOn === false) {
        this.log.debug(logHandlerContext, 'State value was already false, skipping handler');
        return;
      }
      this.state.isOn = false;
      this.log.debug(logHandlerContext, 'State value was true, skipping shortcut run');
      return;
    }

    this.state.isOn = true;

    try {
      await this.shortcut.run();
      this.log.debug(logShortcutContext, 'Exec success');
    } catch (e) {
      this.log.error(logShortcutContext, 'Exec failure', e);
    }

    this.state.isOn = false;
    this.service.updateCharacteristic(this.Characteristic.On, false);

    this.log.debug(logHandlerContext, `value=${value}`);
  }
}
