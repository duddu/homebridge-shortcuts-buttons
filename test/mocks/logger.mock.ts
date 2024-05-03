import { jest } from '@jest/globals';
import { Logger } from 'homebridge';

export const HBLoggerMockedInstance = {
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  success: jest.fn(),
} as unknown as Logger;
