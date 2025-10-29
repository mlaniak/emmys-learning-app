/**
 * Simplified unit tests for Environment Configuration Utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// We need to mock the module before importing it
const mockLocation = {
  hostname: 'localhost',
  origin: 'http://localhost:5173'
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

import {
  isDevelopment,
  isProduction,
  getEnvironment,
  getOAuthConfig,
  getEnvironmentConfig
} from '../environmentConfig.js'

describe('Environment Configuration Utility - Core Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isDevelopment', () => {
    it('should return true for localhost', () => {
      mockLocation.hostname = 'localhost'
      expect(isDevelopment()).toBe(true)
    })

    it('should return true for 127.0.0.1', () => {
      mockLocation.hostname = '127.0.0.1'
      expect(isDevelopment()).toBe(true)
    })

    it('should return true for local network IP', () => {
      mockLocation.hostname = '192.168.1.100'
      expect(isDevelopment()).toBe(true)
    })
  })

  describe('isProduction', () => {
    it('should return false for development environment', () => {
      mockLocation.hostname = 'localhost'
      expect(isProduction()).toBe(false)
    })
  })

  describe('getEnvironment', () => {
    it('should return "development" for dev environment', () => {
      mockLocation.hostname = 'localhost'
      expect(getEnvironment()).toBe('development')
    })
  })

  describe('getOAuthConfig', () => {
    it('should return config with redirectTo URL', () => {
      mockLocation.hostname = 'localhost'
      mockLocation.origin = 'http://localhost:5173'
      
      const config = getOAuthConfig()
      
      expect(config.redirectTo).toContain('/auth/callback')
      expect(config.queryParams).toEqual({
        access_type: 'offline',
        prompt: 'consent'
      })
      expect(config.options.scopes).toBe('email profile')
    })
  })

  describe('getEnvironmentConfig', () => {
    it('should return complete config object', () => {
      mockLocation.hostname = 'localhost'
      mockLocation.origin = 'http://localhost:5173'
      
      const config = getEnvironmentConfig()
      
      expect(config).toHaveProperty('environment')
      expect(config).toHaveProperty('isDevelopment')
      expect(config).toHaveProperty('isProduction')
      expect(config).toHaveProperty('oauth')
      expect(config).toHaveProperty('features')
      expect(config).toHaveProperty('settings')
      
      expect(config.settings.maxRetryAttempts).toBe(3)
      expect(config.settings.retryDelayMs).toBe(1000)
      expect(config.settings.exponentialBackoff).toBe(true)
      expect(config.settings.fallbackTimeout).toBe(30000)
    })
  })
})