import { jest } from '@jest/globals';
import EventEmitter from 'events';
import { generate } from 'hap-nodejs/dist/lib/util/uuid';

class HBApiMock extends EventEmitter {
  public readonly hap = {
    uuid: {
      generate: jest.fn(generate),
    },
  };
}

export const hbApiMockedInstance = new HBApiMock();
