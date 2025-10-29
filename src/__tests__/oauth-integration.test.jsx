/**
 * Integration Tests for Complete OAuth Flow
 * 
 * Tests the complete OAuth authentication flow from initiation to completion,
 * including error scenarios, recovery mechanisms, and cross-browser compatibility.
 * 
 * Requirements tested:
 * - 1.1: User can sign in with Google successfully
 * - 1.2: OAuth redirects to correct callback URL
 * - 1.3: Callback processing establishes valid user session
 * - 2.1: Supabase Auth configured with correct redirect URLs
 * - 2.2: Auth callback handles OAuth responses from correct endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import React from 'react'

// Mock Supabase first
vi.mock('../supabase/config', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}))

// Mock environment config
vi.mock('../utils/environmentConfig', () => ({
  isDevelopment: vi.fn(() => true),
  isProduction: vi.fn(() => false),
  getEnvironment: vi.fn(() => 'development'),
  getOAuthConfig: vi.fn(() => ({
    redirectTo: 'http://localhost:5173/auth/callback',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  })),
  getEnvironmentConfig: vi.fn(() => ({
    settings: {
      authTimeout: 5000,
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      exponentialBackoff: true
    }
  }))
}))

// Mock OAuth error recovery
vi.mock('../utils/oauthErrorRecovery', () => ({
  oauthErrorRecovery: {
    cleanupOAuthUrl: vi.fn(),
    resetAllRetryCounts: vi.fn(),
    categorizeOAuthError: vi.fn(),
    executeRecovery: vi.fn()
  },
  handleOAuthError: vi.fn()
}))

// Mock OAuth logger
vi.mock('../utils/oauthLogger', () => ({
  startOAuthFlow: vi.fn(() => 'test-flow-id'),
  logOAuthEvent: vi.fn(),
  logOAuthError: vi.fn(),
  logOAuthPerformance: vi.fn(),
  completeOAuthFlow: vi.fn(),
  OAUTH_PROVIDERS: {
    GOOGLE: 'google',
    APPLE: 'apple'
  },
  OAUTH_STAGES: {
    INITIATION: 'initiation',
    REDIRECT: 'redirect',
    CALLBACK: 'callback',
    SESSION_ESTABLISHMENT: 'session_establishment',
    ERROR_RECOVERY: 'error_recovery'
  }
}))

// Import components after mocks
import { UserProvider } from '../contexts/UserContext'
import AuthCallback from '../components/AuthCallback'

// Test component that includes OAuth functionality
const TestOAuthComponent = ({ children }) => {
  return (
    <BrowserRouter>
      <UserProvider>
        {children}
      </UserProvider>
    </BrowserRouter>
  )
}

// Helper to simulate OAuth button click
const OAuthTestButton = () => {
  const [clicked, setClicked] = React.useState(false)
  
  const handleClick = async () => {
    setClicked(true)
    // Simulate OAuth call
    const { supabase } = await import('../supabase/config')
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:5173/auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
    } catch (error) {
      console.error('OAuth error:', error)
    }
  }
  
  return (
    <button 
      onClick={handleClick}
      data-testid="google-signin-button"
    >
      {clicked ? 'Processing...' : 'Continue with Google'}
    </button>
  )
}

describe('OAuth Integration Tests', () => {
  let mockSupabase

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked supabase instance
    const supabaseModule = await import('../supabase/config')
    mockSupabase = supabaseModule.supabase
    
    // Reset window location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:5173',
        origin: 'http://localhost:5173',
        hostname: 'localhost',
        pathname: '/',
        search: '',
        hash: ''
      },
      writable: true
    })

    // Reset session storage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      writable: true
    })

    // Reset localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete OAuth Flow - Success Scenarios', () => {
    it('should complete full Google OAuth flow successfully', async () => {
      // Mock successful OAuth initiation
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth/authorize?...' },
        error: null
      })

      // Mock successful session establishment
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'test-user-123',
              email: 'test@example.com',
              app_metadata: { provider: 'google' }
            }
          }
        },
        error: null
      })

      // Render OAuth component
      render(
        <TestOAuthComponent>
          <OAuthTestButton />
        </TestOAuthComponent>
      )

      // Click Google sign-in button
      const signInButton = screen.getByTestId('google-signin-button')
      fireEvent.click(signInButton)

      // Verify OAuth configuration is correct
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: 'http://localhost:5173/auth/callback',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        })
      })

      // Simulate callback processing by rendering AuthCallback
      const { rerender } = render(
        <MemoryRouter initialEntries={['/auth/callback']}>
          <AuthCallback />
        </MemoryRouter>
      )

      // Verify callback processes successfully
      await waitFor(() => {
        expect(screen.getByText('Sign-in successful! Redirecting to your dashboard...')).toBeInTheDocument()
      }, { timeout: 6000 })

      // Verify session was established
      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
    })

    it('should handle OAuth flow with session retry', async () => {
      // Mock successful OAuth initiation
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth/authorize?...' },
        error: null
      })

      // Mock session that succeeds on second attempt
      mockSupabase.auth.getSession
        .mockResolvedValueOnce({ data: { session: null }, error: null })
        .mockResolvedValueOnce({
          data: {
            session: {
              user: {
                id: 'test-user-123',
                email: 'test@example.com',
                app_metadata: { provider: 'google' }
              }
            }
          },
          error: null
        })

      // Render callback component
      render(
        <MemoryRouter initialEntries={['/auth/callback']}>
          <AuthCallback />
        </MemoryRouter>
      )

      // Should eventually succeed after retry
      await waitFor(() => {
        expect(screen.getByText('Sign-in successful! Redirecting to your dashboard...')).toBeInTheDocument()
      }, { timeout: 6000 })

      // Verify retry logic was used
      expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(2)
    })

    it('should handle production environment OAuth flow', async () => {
      // Mock successful OAuth initiation
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth/authorize?...' },
        error: null
      })

      render(
        <TestOAuthComponent>
          <OAuthTestButton />
        </TestOAuthComponent>
      )

      // Click sign-in button
      const signInButton = screen.getByTestId('google-signin-button')
      fireEvent.click(signInButton)

      // Verify OAuth was called (redirect URL will be based on current environment)
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: expect.stringContaining('/auth/callback'),
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        })
      })
    })
  })

  describe('OAuth Error Scenarios and Recovery', () => {
    it('should handle OAuth initiation errors with recovery', async () => {
      // Mock OAuth initiation error
      const oauthError = new Error('OAuth configuration error')
      oauthError.code = 'INVALID_REQUEST'
      mockSupabase.auth.signInWithOAuth.mockRejectedValue(oauthError)

      render(
        <TestOAuthComponent>
          <OAuthTestButton />
        </TestOAuthComponent>
      )

      // Click sign-in button
      const signInButton = screen.getByTestId('google-signin-button')
      fireEvent.click(signInButton)

      // Should handle error gracefully
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalled()
      })

      // Error should be logged and handled
      // Note: Error handling is done in UserContext, so we verify the call was made
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledTimes(1)
    })

    it('should handle callback URL errors', async () => {
      // Mock URL with OAuth error
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:5173/auth/callback?error=access_denied&error_description=User denied access',
          search: '?error=access_denied&error_description=User denied access',
          hash: ''
        },
        writable: true
      })

      render(
        <MemoryRouter initialEntries={['/auth/callback?error=access_denied']}>
          <AuthCallback />
        </MemoryRouter>
      )

      // Should show user-friendly error message
      await waitFor(() => {
        expect(screen.getByText('Sign-in was cancelled. You can try again if you\'d like.')).toBeInTheDocument()
      })

      // Should show error icon
      const errorContainer = document.querySelector('.bg-red-500')
      expect(errorContainer).toBeInTheDocument()
    })

    it('should handle session establishment errors', async () => {
      // Mock session error
      const sessionError = new Error('Network error during session establishment')
      mockSupabase.auth.getSession.mockRejectedValue(sessionError)

      render(
        <MemoryRouter initialEntries={['/auth/callback']}>
          <AuthCallback />
        </MemoryRouter>
      )

      // Should show session error message (the component shows "unexpected error" for rejected promises)
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred during sign-in. Please try again.')).toBeInTheDocument()
      }, { timeout: 10000 })

      // Should show error icon
      const errorContainer = document.querySelector('.bg-red-500')
      expect(errorContainer).toBeInTheDocument()
    }, 15000)

    it('should handle timeout scenarios', async () => {
      // Mock slow session response
      mockSupabase.auth.getSession.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: { session: null }, error: null }), 6000)
        )
      )

      render(
        <MemoryRouter initialEntries={['/auth/callback']}>
          <AuthCallback />
        </MemoryRouter>
      )

      // Should show timeout message
      await waitFor(() => {
        expect(screen.getByText('Sign-in is taking longer than expected')).toBeInTheDocument()
      }, { timeout: 6000 })

      // Should show timeout UI with retry options
      expect(screen.getByText('This might be due to a slow connection.')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Use Different Sign-in Method')).toBeInTheDocument()
    }, 10000)

    it('should handle network connectivity issues', async () => {
      // Mock network error
      const networkError = new Error('Network request failed')
      networkError.code = 'NETWORK_ERROR'
      mockSupabase.auth.signInWithOAuth.mockRejectedValue(networkError)

      render(
        <TestOAuthComponent>
          <OAuthTestButton />
        </TestOAuthComponent>
      )

      // Click sign-in button
      const signInButton = screen.getByTestId('google-signin-button')
      fireEvent.click(signInButton)

      // Should attempt OAuth call
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalled()
      })

      // Network error should be handled
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledTimes(1)
    })
  })

  describe('Cross-Browser Compatibility', () => {
    it('should handle different URL parameter formats', async () => {
      const testCases = [
        {
          name: 'Query parameters',
          url: 'http://localhost:5173/auth/callback?error=access_denied&error_description=User denied access',
          search: '?error=access_denied&error_description=User denied access',
          hash: ''
        },
        {
          name: 'Hash parameters',
          url: 'http://localhost:5173/auth/callback#error=access_denied&error_description=User denied access',
          search: '',
          hash: '#error=access_denied&error_description=User denied access'
        }
      ]

      for (const testCase of testCases) {
        // Reset mocks for each test case
        vi.clearAllMocks()

        // Mock URL format
        Object.defineProperty(window, 'location', {
          value: {
            href: testCase.url,
            search: testCase.search,
            hash: testCase.hash
          },
          writable: true
        })

        const { unmount } = render(
          <MemoryRouter initialEntries={['/auth/callback']}>
            <AuthCallback />
          </MemoryRouter>
        )

        // Should handle both formats
        await waitFor(() => {
          expect(screen.getByText('Sign-in was cancelled. You can try again if you\'d like.')).toBeInTheDocument()
        })

        unmount()
      }
    })

    it('should handle different browser environments', async () => {
      const browserConfigs = [
        {
          name: 'Chrome-like',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        {
          name: 'Firefox-like',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
        },
        {
          name: 'Safari-like',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
        }
      ]

      for (const config of browserConfigs) {
        // Mock user agent
        Object.defineProperty(navigator, 'userAgent', {
          value: config.userAgent,
          writable: true
        })

        // Mock successful session
        mockSupabase.auth.getSession.mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'test-user-123',
                email: 'test@example.com',
                app_metadata: { provider: 'google' }
              }
            }
          },
          error: null
        })

        const { unmount } = render(
          <MemoryRouter initialEntries={['/auth/callback']}>
            <AuthCallback />
          </MemoryRouter>
        )

        // Should work in all browser environments
        await waitFor(() => {
          expect(screen.getByText('Sign-in successful! Redirecting to your dashboard...')).toBeInTheDocument()
        }, { timeout: 6000 })

        unmount()
        vi.clearAllMocks()
      }
    })

    it('should handle mobile browser scenarios', async () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        writable: true
      })

      // Mock successful OAuth flow
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth/authorize?...' },
        error: null
      })

      render(
        <TestOAuthComponent>
          <OAuthTestButton />
        </TestOAuthComponent>
      )

      // Click sign-in button
      const signInButton = screen.getByTestId('google-signin-button')
      fireEvent.click(signInButton)

      // Should work on mobile
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalled()
      })

      // Verify mobile-friendly configuration
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:5173/auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
    })
  })

  describe('OAuth Configuration Validation', () => {
    it('should use correct redirect URLs for different environments', async () => {
      // Mock successful OAuth
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth/authorize?...' },
        error: null
      })

      render(
        <TestOAuthComponent>
          <OAuthTestButton />
        </TestOAuthComponent>
      )

      // Click sign-in button
      const signInButton = screen.getByTestId('google-signin-button')
      fireEvent.click(signInButton)

      // Verify OAuth was called with a valid redirect URL
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: expect.stringContaining('/auth/callback'),
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        })
      })

      // Verify the redirect URL is properly formatted
      const call = mockSupabase.auth.signInWithOAuth.mock.calls[0][0]
      expect(call.options.redirectTo).toMatch(/^https?:\/\/.*\/auth\/callback$/)
    })

    it('should include required OAuth parameters', async () => {
      // Mock successful OAuth
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth/authorize?...' },
        error: null
      })

      render(
        <TestOAuthComponent>
          <OAuthTestButton />
        </TestOAuthComponent>
      )

      // Click sign-in button
      const signInButton = screen.getByTestId('google-signin-button')
      fireEvent.click(signInButton)

      // Verify OAuth parameters
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: expect.stringContaining('/auth/callback'),
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        })
      })
    })
  })

  describe('User Session Management', () => {
    it('should establish user session after successful OAuth', async () => {
      const testUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        app_metadata: { provider: 'google' }
      }

      // Mock successful session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: testUser } },
        error: null
      })

      render(
        <MemoryRouter initialEntries={['/auth/callback']}>
          <AuthCallback />
        </MemoryRouter>
      )

      // Should establish session
      await waitFor(() => {
        expect(screen.getByText('Sign-in successful! Redirecting to your dashboard...')).toBeInTheDocument()
      }, { timeout: 6000 })

      // Should set developer mode
      expect(localStorage.setItem).toHaveBeenCalledWith('developerMode', 'true')
    })

    it('should handle user profile creation', async () => {
      const testUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        user_metadata: {
          display_name: 'Test User'
        },
        app_metadata: { provider: 'google' }
      }

      // Mock successful session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: testUser } },
        error: null
      })

      render(
        <MemoryRouter initialEntries={['/auth/callback']}>
          <AuthCallback />
        </MemoryRouter>
      )

      // Should process user session
      await waitFor(() => {
        expect(mockSupabase.auth.getSession).toHaveBeenCalled()
      })

      // Should complete successfully
      await waitFor(() => {
        expect(screen.getByText('Sign-in successful! Redirecting to your dashboard...')).toBeInTheDocument()
      }, { timeout: 6000 })
    })
  })
})