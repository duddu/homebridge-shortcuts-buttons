import { CharacteristicValue, Service } from 'homebridge';

import {
  ShortcutsButtonsPlatform,
  ShortcutsButtonsPlatformConfig,
} from './platform';
import { Shortcut } from './shortcut';

export type ShortcutsButtonsPlatformServiceConfig =
  ShortcutsButtonsPlatformConfig['buttons'][number];

class ShortcutsButtonsAccessoryServiceState {
  isOn: boolean = false;
  isBusy: boolean = false;
}

export class ShortcutsButtonsAccessoryService {
  private readonly state: ShortcutsButtonsAccessoryServiceState;
  private readonly shortcut: Shortcut;

  constructor(
    private readonly platform: ShortcutsButtonsPlatform,
    private readonly service: Service,
    private readonly config: ShortcutsButtonsPlatformServiceConfig,
  ) {
    this.service
      .setCharacteristic(this.platform.Characteristic.Name, this.config.name)
      .setCharacteristic(
        this.platform.Characteristic.ConfiguredName,
        this.config.name,
      )
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));

    this.state = new ShortcutsButtonsAccessoryServiceState();
    this.shortcut = new Shortcut(this.config.shortcut, this.service.UUID);
  }

  private async getOn(): Promise<CharacteristicValue> {
    const isOn = this.state.isOn;

    this.platform.log.debug(
      `Get Characteristic On for ${this.service.displayName} ->`,
      isOn,
    );

    return isOn;
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    // @TODO: return error busy if shortcut in progress
    this.state.isOn = value as boolean;

    this.platform.log.debug(
      `Set Characteristic On for button ${this.service.displayName} ->`,
      value,
    );

    return this.shortcut.run();
  }
}
