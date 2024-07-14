import { jest } from '@jest/globals';
import { Logging } from 'homebridge';

export const hbLoggerMockedInstance = {
  prefix: 'prefixMock',
  log: jest.fn() as Logging['log'],
  debug: jest.fn() as Logging['debug'],
  info: jest.fn() as Logging['info'],
  error: jest.fn() as Logging['error'],
  warn: jest.fn() as Logging['warn'],
  success: jest.fn() as Logging['success'],
} as Logging;
