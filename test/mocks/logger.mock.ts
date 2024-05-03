import { jest } from '@jest/globals';
import { Logger } from 'homebridge';

export const hbLoggerMockedInstance = {
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  success: jest.fn(),
} as unknown as Logger;
