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

export type HSBServiceType = typeof Service.Outlet | typeof Service.Switch;

export type HSBServiceConfig = HSBConfig['services'][number];

class HSBServiceState {
  isOn: boolean = false;
}

class HSBServiceToggleBackOffTimeout {
  private readonly delay = 650;

  private timeout: NodeJS.Timeout | undefined;

  constructor(private readonly callback: () => void) {}

  public set() {
    this.timeout = setTimeout(this.callback, this.delay);
  }

  public clear(): void {
    clearTimeout(this.timeout);
  }
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

    service
      .setCharacteristic(Characteristic.Name, serviceConfig.name)
      .setCharacteristic(Characteristic.ConfiguredName, serviceConfig.name)
      .getCharacteristic(Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));
  }

  private async getOn(): Promise<CharacteristicValue> {
    const isOn = this.state.isOn;

    this.log.debug(`Service(${this.service.displayName})::getOn`, `Value=${isOn}`);

    return isOn;
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    this.log.debug(this.logSetHandlerContext, `Value=${value}`);

    if (value === false) {
      if (this.state.isOn === false) {
        this.log.debug(
          this.logSetHandlerContext,
          'State value was already false, skipping handler',
        );
        return;
      }
      this.state.isOn = false;
      this.log.debug(this.logSetHandlerContext, 'State value was true, skipping shortcut run');
      return;
    }

    this.toggleBackOffTimeout.clear();

    this.state.isOn = true;

    try {
      await this.shortcut.run();
      this.log.debug(this.logShortcutRunContext, 'Exec succeded');
    } catch (e) {
      this.log.error(this.logShortcutRunContext, 'Exec failed', e);
    }

    this.toggleBackOffTimeout.set();
  }

  private readonly toggleBackOffTimeout = new HSBServiceToggleBackOffTimeout(() => {
    this.state.isOn = false;
    this.service.updateCharacteristic(this.Characteristic.On, false);
    this.log.debug(this.logSetHandlerContext, 'Characteristic value set back to false');
  });

  private get logSetHandlerContext(): string {
    return `Service(${this.service.displayName})::setOn`;
  }

  private get logShortcutRunContext(): string {
    return `${this.logSetHandlerContext} Shortcut(${this.serviceConfig.shortcut})::run`;
  }
}
