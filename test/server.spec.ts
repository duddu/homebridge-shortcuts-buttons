import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import EventEmitter from 'events';
import { API, Nullable } from 'homebridge';
import http, { IncomingMessage, METHODS, ServerResponse, createServer } from 'http';
import { Socket } from 'net';

import { HSBConfig } from '../src/config';
import { HSBXCallbackUrlServer } from '../src/server';
import { HSBXCallbackUrlServerCommand } from '../src/server/command';
import {
  HSBXCallbackUrlRequiredSearchParamsKeys,
  HSBXCallbackUrlSearchParams,
} from '../src/server/params';
import { HSBShortcutStatus } from '../src/shortcut';
import { HSBUtils } from '../src/utils';

import { hbApiMockedInstance } from './mocks/api.mock';
import { hbLoggerMockedInstance } from './mocks/logger.mock';

class HttpServerMock extends EventEmitter {
  public readonly listen = jest.fn((_port, _hostname, cb: () => void) => cb());
  public readonly closeAllConnections = jest.fn();
}
let httpServerMock: HttpServerMock;
jest.mock('http', () => ({
  ...jest.requireActual<typeof http>('http'),
  createServer: jest.fn((): HttpServerMock => (httpServerMock = new HttpServerMock())),
}));

const utilsMock = new HSBUtils(hbLoggerMockedInstance);
utilsMock.execAsync = jest.fn(() => Promise.resolve());

describe(HSBXCallbackUrlServer.name, () => {
  let server: HSBXCallbackUrlServer;
  const defaultConfig = {
    name: 'platformMock',
    callbackServerEnabled: true,
    callbackCommandType: 'Default (display notification)',
    callbackCustomCommand: '',
    callbackCommandTimeout: 7,
    callbackServerProtocol: 'https',
    callbackServerHostname: 'hostname-mock',
    callbackServerPort: 1234,
  } as HSBConfig;
  const instantiateServer = (configOverride?: Partial<HSBConfig>) => {
    server = new HSBXCallbackUrlServer(
      {
        ...defaultConfig,
        ...configOverride,
      },
      hbLoggerMockedInstance,
      utilsMock,
      hbApiMockedInstance as unknown as API,
    );
  };

  afterEach(() => {
    httpServerMock.removeAllListeners();
    hbApiMockedInstance.removeAllListeners();
    utilsMock.execAsync = jest.fn(() => Promise.resolve());
  });

  describe('constructor', () => {
    test('should create an http server', () => {
      instantiateServer();

      expect(createServer).toHaveBeenCalledTimes(1);
      expect(createServer).toHaveBeenCalledWith({ requestTimeout: 30000 });
    });

    test('should make server listen on configured host and port', () => {
      instantiateServer();

      expect(httpServerMock.listen).toHaveBeenCalledTimes(1);
      expect(httpServerMock.listen).toHaveBeenCalledWith(
        1234,
        'hostname-mock',
        expect.any(Function),
      );
      expect(hbLoggerMockedInstance.info).toHaveBeenLastCalledWith(
        expect.stringMatching(/listening/i),
      );
    });

    describe('should not create a server ', () => {
      test('if callbackServerEnabled is false', () => {
        instantiateServer({ callbackServerEnabled: false });

        expect(createServer).not.toHaveBeenCalled();
      });
    });
  });

  describe('baseUrl', () => {
    test('should be the a url composed from config values', () => {
      instantiateServer();

      expect(server.baseUrl).toBe('https://hostname-mock:1234/x-callback-url');
    });
  });

  describe(HSBXCallbackUrlServer.prototype.issueToken.name, () => {
    test('should issue a date based generated uuid', () => {
      instantiateServer();

      expect(server.issueToken()).toMatch(/^[\w\d]{8}-[\w\d]{4}-[\w\d]{4}-[\w\d]{4}-[\w\d]{12}$/);
    });
  });

  describe(HSBXCallbackUrlServer.prototype['destroy'].name, () => {
    test('should destroy server on api shutdown event', () => {
      instantiateServer();

      const removeListenersSpy = jest.spyOn(httpServerMock, 'removeAllListeners');
      hbApiMockedInstance.emit('shutdown');

      expect(httpServerMock.closeAllConnections).toHaveBeenCalledTimes(1);
      expect(removeListenersSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('on:error', () => {
    test('should log the error instance', () => {
      instantiateServer();

      const errorMock = new Error('onErrorMessage');
      httpServerMock.emit('error', errorMock);

      expect(hbLoggerMockedInstance.error).toHaveBeenLastCalledWith(
        expect.stringMatching(/error/i),
        errorMock,
      );
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
    const getValidSearchParams = () => ({
      shortcut: 'shortcutMock',
      status: HSBShortcutStatus.SUCCESS,
      token: server.issueToken(),
    });
    const emitRequest = (
      searchParams: Nullable<Record<string, string>> = getValidSearchParams(),
      url: Nullable<string> = requestMock.url!,
      method: Nullable<string> = requestMock.method!,
    ) => {
      requestMock.url = url || undefined;
      if (searchParams && url) {
        requestMock.url += `?${new URLSearchParams(searchParams).toString()}`;
      }
      requestMock.method = method || undefined;
      httpServerMock.emit('request', requestMock, responseMock);
    };
    const expectStatusCode = (statusCode: number) => {
      statusCode !== 200 &&
        expect(hbLoggerMockedInstance.error).toHaveBeenLastCalledWith(
          expect.stringContaining(statusCode.toString()),
          expect.any(String),
          expect.not.arrayContaining([null]),
        );
      expect(resWriteHeadSpy).toHaveBeenCalledTimes(1);
      expect(resWriteHeadSpy).toHaveBeenCalledWith(statusCode);
      expect(resWriteSpy).toHaveBeenCalledTimes(1);
      expect(resWriteSpy).toHaveBeenCalledWith(expect.stringContaining('<!DOCTYPE html>'));
      expect(resEndSpy).toHaveBeenCalledTimes(1);
    };
    const waitForCommand = async () => new Promise(process.nextTick);

    beforeEach(resetReqResMocks);

    describe('should respond with status code 405', () => {
      test('if the request has no url', () => {
        instantiateServer();
        emitRequest({}, null);

        expectStatusCode(405);
      });

      test.each(METHODS.filter((m) => m !== 'GET'))(
        'if the request has method %s',
        async (method) => {
          instantiateServer();
          emitRequest({}, undefined, method);

          expectStatusCode(405);
        },
      );
    });

    describe('should respond with status code 404', () => {
      test('if the request has root pathname', () => {
        instantiateServer();
        emitRequest({}, '/');

        expectStatusCode(404);
      });

      test('if the request has invalid pathname', () => {
        instantiateServer();
        emitRequest({}, '/invalid-path');

        expectStatusCode(404);
      });
    });

    describe('should respond with status code 400', () => {
      test('if all required search params are missing', () => {
        instantiateServer();
        emitRequest(null);

        expectStatusCode(400);
      });

      test.each(Object.values(HSBXCallbackUrlRequiredSearchParamsKeys))(
        'if %s search param is missing',
        (param) => {
          instantiateServer();
          emitRequest({
            ...getValidSearchParams(),
            [param]: '',
          });

          expectStatusCode(400);
        },
      );
    });

    describe('should respond with status code 403', () => {
      test('if the authorization token is invalid', () => {
        instantiateServer();
        emitRequest({
          ...getValidSearchParams(),
          token: 'invalid-token',
        });

        expectStatusCode(403);
      });

      test('if the authorization token is already consumed', () => {
        instantiateServer();

        const validParams = getValidSearchParams();
        emitRequest(validParams);

        jest.clearAllMocks();
        resetReqResMocks();

        emitRequest(validParams);

        expectStatusCode(403);
      });
    });

    describe('should respond with status code 500', () => {
      test('if command type is undefined', async () => {
        instantiateServer({ callbackCommandType: undefined });
        emitRequest();

        await waitForCommand();

        expectStatusCode(500);
        expect(utilsMock.execAsync).not.toHaveBeenCalled();
      });

      test('if command type is an invalid value', async () => {
        instantiateServer({ callbackCommandType: 'invalidType' } as unknown as HSBConfig);
        emitRequest();

        await waitForCommand();

        expectStatusCode(500);
        expect(utilsMock.execAsync).not.toHaveBeenCalled();
      });

      test('if command type is custom but command is empty', async () => {
        instantiateServer({
          callbackCommandType: 'Custom unix command',
          callbackCustomCommand: '',
        });
        emitRequest();

        await waitForCommand();

        expectStatusCode(500);
        expect(utilsMock.execAsync).not.toHaveBeenCalled();
      });

      test('if command type is shortcut but command is empty', async () => {
        instantiateServer({
          callbackCommandType: 'Shortcut name',
          callbackCustomCommand: '',
        });
        emitRequest();

        await waitForCommand();

        expectStatusCode(500);
        expect(utilsMock.execAsync).not.toHaveBeenCalled();
      });
    });

    describe('should respond with status code 200', () => {
      test('if config is valid and request validators have passed', async () => {
        instantiateServer();
        emitRequest();

        await waitForCommand();

        expectStatusCode(200);
        expect(hbLoggerMockedInstance.success).toHaveBeenCalledTimes(1);
      });

      describe('and should execute callback command', () => {
        test('if command type is default and status success', async () => {
          instantiateServer();
          emitRequest({
            ...getValidSearchParams(),
            result: 'resultMock with special chars \u2018\u2019\u201C\u201D',
            errorMessage: 'errorMock',
          });

          await waitForCommand();

          expect(utilsMock.execAsync).toHaveBeenCalledTimes(1);
          expect(utilsMock.execAsync).toHaveBeenCalledWith(
            expect.stringMatching(
              // eslint-disable-next-line max-len
              /open .*src\/bin\/HomebridgeShortcutsButtons\\ -\\ Notify\\ Shortcut\\ Result.app --env NOTIFICATION_TITLE="platformMock" --env NOTIFICATION_SUBTITLE="shortcutMock executed successfully\nResult: resultMock with special chars ''''" --env NOTIFICATION_SOUND="Glass"/,
            ),
            {
              env: {
                SHORTCUT_ERROR: 'errorMock',
                SHORTCUT_NAME: 'shortcutMock',
                SHORTCUT_RESULT: `resultMock with special chars ''''`,
                SHORTCUT_STATUS: 'success',
              },
              timeout: 7,
            },
          );
          expect(hbLoggerMockedInstance.success).toHaveBeenCalledTimes(1);
          expectStatusCode(200);
        });

        test('if command type is default and status error', async () => {
          instantiateServer();
          emitRequest({
            ...getValidSearchParams(),
            result: 'resultMock',
            errorMessage: 'errorMock',
            status: HSBShortcutStatus.ERROR,
          });

          await waitForCommand();

          expect(utilsMock.execAsync).toHaveBeenCalledTimes(1);
          expect(utilsMock.execAsync).toHaveBeenCalledWith(
            expect.stringMatching(
              // eslint-disable-next-line max-len
              /open .*src\/bin\/HomebridgeShortcutsButtons\\ -\\ Notify\\ Shortcut\\ Result.app --env NOTIFICATION_TITLE="platformMock" --env NOTIFICATION_SUBTITLE="shortcutMock execution failed\nError: errorMock" --env NOTIFICATION_SOUND="Sosumi"/,
            ),
            {
              env: {
                SHORTCUT_ERROR: 'errorMock',
                SHORTCUT_NAME: 'shortcutMock',
                SHORTCUT_RESULT: 'resultMock',
                SHORTCUT_STATUS: 'error',
              },
              timeout: 7,
            },
          );
          expect(hbLoggerMockedInstance.success).toHaveBeenCalledTimes(1);
          expectStatusCode(200);
        });

        test('if command type is default and status cancel', async () => {
          instantiateServer();
          emitRequest({
            ...getValidSearchParams(),
            result: 'resultMock',
            errorMessage: 'errorMock',
            status: HSBShortcutStatus.CANCEL,
          });

          await waitForCommand();

          expect(utilsMock.execAsync).toHaveBeenCalledTimes(1);
          expect(utilsMock.execAsync).toHaveBeenCalledWith(
            expect.stringMatching(
              // eslint-disable-next-line max-len
              /open .*src\/bin\/HomebridgeShortcutsButtons\\ -\\ Notify\\ Shortcut\\ Result.app --env NOTIFICATION_TITLE="platformMock" --env NOTIFICATION_SUBTITLE="shortcutMock execution was cancelled" --env NOTIFICATION_SOUND="Sosumi"/,
            ),
            {
              env: {
                SHORTCUT_ERROR: 'errorMock',
                SHORTCUT_NAME: 'shortcutMock',
                SHORTCUT_RESULT: 'resultMock',
                SHORTCUT_STATUS: 'cancel',
              },
              timeout: 7,
            },
          );
          expect(hbLoggerMockedInstance.success).toHaveBeenCalledTimes(1);
          expectStatusCode(200);
        });

        test('if command type is default and status invalid', async () => {
          instantiateServer();
          emitRequest({
            ...getValidSearchParams(),
            result: 'resultMock',
            errorMessage: 'errorMock',
            status: 'invalid' as unknown as HSBShortcutStatus,
          });

          await waitForCommand();

          expect(utilsMock.execAsync).toHaveBeenCalledTimes(1);
          expect(utilsMock.execAsync).toHaveBeenCalledWith(
            expect.stringMatching(
              // eslint-disable-next-line max-len
              /open .*src\/bin\/HomebridgeShortcutsButtons\\ -\\ Notify\\ Shortcut\\ Result.app --env NOTIFICATION_TITLE="platformMock" --env NOTIFICATION_SUBTITLE="shortcutMock received an unknown result status" --env NOTIFICATION_SOUND="Sosumi"/,
            ),
            {
              env: {
                SHORTCUT_ERROR: 'errorMock',
                SHORTCUT_NAME: 'shortcutMock',
                SHORTCUT_RESULT: 'resultMock',
                SHORTCUT_STATUS: 'invalid',
              },
              timeout: 7,
            },
          );
          expect(hbLoggerMockedInstance.success).toHaveBeenCalledTimes(1);
          expectStatusCode(200);
        });

        test('if command type is custom', async () => {
          instantiateServer({
            callbackCommandType: 'Custom unix command',
            callbackCustomCommand: 'custom-command-mock',
          });
          emitRequest({
            ...getValidSearchParams(),
            result: 'resultMock',
            errorMessage: 'errorMock',
          });

          await waitForCommand();

          expect(utilsMock.execAsync).toHaveBeenCalledTimes(1);
          expect(utilsMock.execAsync).toHaveBeenCalledWith('custom-command-mock', {
            env: {
              SHORTCUT_ERROR: 'errorMock',
              SHORTCUT_NAME: 'shortcutMock',
              SHORTCUT_RESULT: 'resultMock',
              SHORTCUT_STATUS: 'success',
            },
            timeout: 7,
          });
          expect(hbLoggerMockedInstance.success).toHaveBeenCalledTimes(1);
          expectStatusCode(200);
        });

        test('if command type is shortcut', async () => {
          instantiateServer({
            callbackCommandType: 'Shortcut name',
            callbackCustomCommand: 'Callback Shortcut Mock',
          });
          emitRequest({
            ...getValidSearchParams(),
            result: 'resultMock',
            errorMessage: 'errorMock',
          });

          await waitForCommand();

          expect(utilsMock.execAsync).toHaveBeenCalledTimes(1);
          expect(utilsMock.execAsync).toHaveBeenCalledWith(
            // eslint-disable-next-line max-len
            'open -gj shortcuts://run-shortcut\\?name=Callback%20Shortcut%20Mock\\&input=text\\&text=eyJTSE9SVENVVF9FUlJPUiI6ImVycm9yTW9jayIsIlNIT1JUQ1VUX05BTUUiOiJzaG9ydGN1dE1vY2siLCJTSE9SVENVVF9SRVNVTFQiOiJyZXN1bHRNb2NrIiwiU0hPUlRDVVRfU1RBVFVTIjoic3VjY2VzcyJ9',
          );
          expect(hbLoggerMockedInstance.success).toHaveBeenCalledTimes(1);
          expectStatusCode(200);
        });
      });
    });
  });
});

describe(HSBXCallbackUrlServerCommand.name, () => {
  describe('constructor', () => {
    test('should throw if search params invalid', () => {
      const getServerCommand = (additionalSearchParams: Record<string, string>) =>
        new HSBXCallbackUrlServerCommand(
          new HSBXCallbackUrlSearchParams(
            new URLSearchParams({
              token: 'tokenMock',
              ...additionalSearchParams,
            }),
            utilsMock,
          ),
          {} as HSBConfig,
          utilsMock,
        );
      const expectedError =
        'HSBXCallbackUrlServerCommandEnvironment Invalid callback url search params';

      expect(() => getServerCommand({ status: 'success' })).toThrowError(expectedError);
      expect(() => getServerCommand({ shortcut: 'shortcutMock' })).toThrowError(expectedError);
    });
  });
});
