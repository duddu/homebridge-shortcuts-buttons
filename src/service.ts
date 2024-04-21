import { Characteristic, CharacteristicValue, Logger, Nullable, Service } from 'homebridge';

import { ShortcutsButtonsPlatformConfig } from './platform';
import { Shortcut } from './shortcut';

export type ShortcutsButtonsPlatformServiceConfig =
  ShortcutsButtonsPlatformConfig['buttons'][number];

class ShortcutsButtonsAccessoryServiceState {
  isOn: boolean = false;
}

export class ShortcutsButtonsAccessoryService {
  private readonly state: ShortcutsButtonsAccessoryServiceState;
  private readonly shortcut: Shortcut;

  constructor(
    private readonly log: Logger,
    private readonly service: Service,
    private readonly serviceConfig: ShortcutsButtonsPlatformServiceConfig,
    serverBaseUrl: Nullable<string>,
    _Characteristic: typeof Characteristic,
  ) {
    this.service
      .setCharacteristic(_Characteristic.Name, serviceConfig.name)
      .setCharacteristic(_Characteristic.ConfiguredName, serviceConfig.name)
      .getCharacteristic(_Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));

    this.state = new ShortcutsButtonsAccessoryServiceState();
    this.shortcut = new Shortcut(serviceConfig.shortcut, service.UUID, serverBaseUrl, log);
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
