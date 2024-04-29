import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import EventEmitter from 'events';
import { API, Logger } from 'homebridge';
import http, { IncomingMessage, METHODS, ServerResponse, createServer } from 'http';
import { Socket } from 'net';

import { HSBConfig } from '../src/config';
import { HSBXCallbackUrlSearchParamsType, requiredParamsKeysList } from '../src/server/params';
import { HSBXCallbackUrlServer } from '../src/server';
import { HSBShortcutStatus } from '../src/shortcut';
import { HSBUtils } from '../src/utils';

class HttpServerMock extends EventEmitter {
  public readonly listen = jest.fn();
  public readonly closeAllConnections = jest.fn();
}
let httpServerMock: HttpServerMock;
jest.mock('http', () => ({
  ...jest.requireActual<typeof http>('http'),
  createServer: jest.fn((): HttpServerMock => (httpServerMock = new HttpServerMock())),
}));

class HBApiMock extends EventEmitter {
  public readonly hap = {
    uuid: {
      generate: (str: string) => 'uuid_' + str,
    },
  };
}
const apiMock = new HBApiMock();

const loggerMock = {
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  success: jest.fn(),
} as unknown as Logger;

const utilsMock = new HSBUtils(loggerMock);
utilsMock.execAsync = jest.fn(() => Promise.resolve());

describe(HSBXCallbackUrlServer.name, () => {
  let server: HSBXCallbackUrlServer;

  beforeEach(() => {
    server = new HSBXCallbackUrlServer(
      {
        callbackServerEnabled: true,
        callbackServerProtocol: 'https',
        callbackServerHostname: 'hostname-mock',
        callbackServerPort: 1234,
      } as HSBConfig,
      loggerMock,
      utilsMock,
      apiMock as unknown as API,
    );
  });

  afterEach(() => {
    httpServerMock.removeAllListeners();
    apiMock.removeAllListeners();
  });

  describe('constructor', () => {
    test('should create an http server', () => {
      expect(createServer).toHaveBeenCalledTimes(1);
      expect(createServer).toHaveBeenCalledWith({ requestTimeout: 30000 });
    });

    test('should make server listen on configured host and port', () => {
      expect(httpServerMock.listen).toHaveBeenCalledTimes(1);
      expect(httpServerMock.listen).toHaveBeenCalledWith(
        1234,
        'hostname-mock',
        expect.any(Function),
      );
    });

    test('should not create a server if callbackServerEnabled is false', () => {
      jest.clearAllMocks();

      new HSBXCallbackUrlServer(
        {
          callbackServerEnabled: false,
          callbackServerProtocol: 'https',
          callbackServerHostname: 'hostnameMock',
          callbackServerPort: 1234,
        } as HSBConfig,
        loggerMock,
        utilsMock,
        apiMock as unknown as API,
      );

      expect(createServer).not.toHaveBeenCalled();
    });
  });

  describe('baseUrl', () => {
    test('should be the a url composed from config values', () => {
      expect(server.baseUrl).toBe('https://hostname-mock:1234/x-callback-url');
    });
  });

  describe(HSBXCallbackUrlServer.prototype.issueToken.name, () => {
    test('should issue a date based generated uuid', () => {
      expect(server.issueToken()).toMatch(RegExp(`uuid_${HSBXCallbackUrlServer.name}_\\d{13}`));
    });
  });

  describe('on:error', () => {
    test('should log the error instance', () => {
      const errorMock = new Error('onErrorMessage');
      httpServerMock.emit('error', errorMock);

      expect(loggerMock.error).toHaveBeenLastCalledWith(expect.stringMatching(/error/i), errorMock);
    });
  });

  describe('on:request', () => {
    let requestMock: IncomingMessage;
    let responseMock: ServerResponse;
    let resWriteHeadSpy: ReturnType<typeof jest.spyOn>;
    let resWriteSpy: ReturnType<typeof jest.spyOn>;
    let resEndSpy: ReturnType<typeof jest.spyOn>;

    const resetReqResMocks = () => {
      requestMock = new IncomingMessage(new Socket());
      requestMock.method = 'GET';
      requestMock.url = '/x-callback-url';
      responseMock = new ServerResponse(requestMock);
      resWriteHeadSpy = jest.spyOn(responseMock, 'writeHead');
      resWriteSpy = jest.spyOn(responseMock, 'write');
      resEndSpy = jest.spyOn(responseMock, 'end');
    };
    const setSearchParamsMock = (searchParams: Partial<HSBXCallbackUrlSearchParamsType> = {}) => {
      requestMock.url = `${requestMock.url}?${new URLSearchParams(searchParams).toString()}`;
    };
    const emitRequest = () => httpServerMock.emit('request', requestMock, responseMock);
    const expectStatusCode = (statusCode: number) => {
      expect(resWriteHeadSpy).toHaveBeenCalledTimes(1);
      expect(resWriteHeadSpy).toHaveBeenCalledWith(statusCode);
      expect(resWriteSpy).toHaveBeenCalledTimes(1);
      expect(resWriteSpy).toHaveBeenCalledWith(expect.stringContaining('<!DOCTYPE html>'));
      expect(resEndSpy).toHaveBeenCalledTimes(1);
    };

    beforeEach(resetReqResMocks);

    describe('should respond with status code 405', () => {
      test('if the request has no url', () => {
        requestMock.url = undefined;
        emitRequest();

        expectStatusCode(405);
      });

      test.each(METHODS.filter((m) => m !== 'GET'))(
        'if the request has method %s',
        async (method) => {
          requestMock.method = method;
          emitRequest();

          expectStatusCode(405);
        },
      );
    });

    describe('should respond with status code 404', () => {
      test('if the request has root pathname', () => {
        requestMock.url = '/';
        emitRequest();

        expectStatusCode(404);
      });

      test('if the request has invalid pathname', () => {
        requestMock.url = '/invalid-path';
        emitRequest();

        expectStatusCode(404);
      });
    });

    describe('should respond with status code 400', () => {
      test('if all required search params are missing', () => {
        emitRequest();

        expectStatusCode(400);
      });

      test.each(requiredParamsKeysList)('if %s search param is missing', (param: string) => {
        setSearchParamsMock({
          shortcut: 'shortcutMock',
          status: HSBShortcutStatus.SUCCESS,
          token: server.issueToken(),
          [param]: '',
        });
        emitRequest();

        expectStatusCode(400);
      });
    });

    describe('should respond with status code 403', () => {
      test('if the authorization token is invalid', () => {
        server.issueToken();
        setSearchParamsMock({
          shortcut: 'shortcutMock',
          status: HSBShortcutStatus.SUCCESS,
          token: 'invalid-token',
        });
        emitRequest();

        expectStatusCode(403);
      });

      test('if the authorization token is invalid', () => {
        const tokenMock = server.issueToken();
        setSearchParamsMock({
          shortcut: 'shortcutMock',
          status: HSBShortcutStatus.SUCCESS,
          token: tokenMock,
        });
        emitRequest();

        jest.clearAllMocks();
        resetReqResMocks();

        setSearchParamsMock({
          shortcut: 'shortcutMock',
          status: HSBShortcutStatus.SUCCESS,
          token: tokenMock,
        });
        emitRequest();

        expectStatusCode(403);
      });
    });
  });
});
