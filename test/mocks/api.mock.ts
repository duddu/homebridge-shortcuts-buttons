import EventEmitter from 'events';

class HBApiMock extends EventEmitter {
  public readonly hap = {
    uuid: {
      generate: (str: string) => 'uuid_' + str,
    },
  };
}

export const HBApiMockedInstance = new HBApiMock();
