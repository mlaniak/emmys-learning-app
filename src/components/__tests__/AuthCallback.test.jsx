/**
 * Unit tests for AuthCallback component
 * Tests OAuth callback processing, error handling, and user feedback
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AuthCallback from '../AuthCallback'

// Mock dependencies
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock Supabase
vi.mock('../../supabase/config', () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    }
  }
}))

// Mock environment config
vi.mock('../../utils/environmentConfig', () => ({
  isDevelopment: vi.fn(() => true),
  getEnvironmentConfig: vi.fn(() => ({
    settings: {
      authTimeout: 5000
    }
  }))
}))

// Mock OAuth error recovery
vi.mock('../../utils/oauthErrorRecovery', () => ({
  oauthErrorRecovery: {
    cleanupOAuthUrl: vi.fn()
  }
}))

// Mock OAuth logger
vi.mock('../../utils/oauthLogger', () => ({
  logOAuthEvent: vi.fn(),
  logOAuthError: vi.fn(),
  logOAuthPerformance: vi.fn(),
  completeOAuthFlow: vi.fn(),
  OAUTH_STAGES: {
    CALLBACK: 'callback',
    SESSION_ESTABLISHMENT: 'session_establishment'
  }
}))

// Helper to render component with router
const renderAuthCallback = () => {
  return render(
    <BrowserRouter>
      <AuthCallback />
    </BrowserRouter>
  )
}

describe('AuthCallback Component', () => {
  let mockSupabase
  let mockOAuthErrorRecovery

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get mocked modules
    const supabaseModule = await import('../../supabase/config')
    const oauthModule = await import('../../utils/oauthErrorRecovery')
    mockSupabase = supabaseModule.supabase
    mockOAuthErrorRecovery = oauthModule.oauthErrorRecovery
    
    // Reset window location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:5173/auth/callback',
        search: '',
        hash: '',
        origin: 'http://localhost:5173'
      },
      writable: true
    })

    // Reset session storage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => 'test-flow-id'),
        removeItem: vi.fn()
      },
      writable: true
    })

    // Reset localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: vi.fn()
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Successful OAuth Flow', () => {
    it('should process successful OAuth callback', async () => {
      // Mock successful session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'test-user-123',
              app_metadata: { provider: 'google' }
            }
          }
        },
        error: null
      })

      renderAuthCallback()

      // Should show processing message initially (component starts with verification)
      expect(screen.getByText('Verifying your authentication...')).toBeInTheDocument()
      expect(screen.getByText('Please wait while we process your authentication')).toBeInTheDocument()

      // Wait for success state
      await waitFor(() => {
        expect(screen.getByText('Sign-in successful! Redirecting to your dashboard...')).toBeInTheDocument()
      }, { timeout: 6000 })

      // Should clean up OAuth URL
      expect(mockOAuthErrorRecovery.cleanupOAuthUrl).toHaveBeenCalled()

      // Should set developer mode
      expect(localStorage.setItem).toHaveBeenCalledWith('developerMode', 'true')
    })

    it('should handle session establishment with retries', async () => {
      // Mock session that succeeds on second attempt
      mockSupabase.auth.getSession
        .mockResolvedValueOnce({ data: { session: null }, error: null })
        .mockResolvedValueOnce({
          data: {
            session: {
              user: {
                id: 'test-user-123',
                app_metadata: { provider: 'google' }
              }
            }
          },
          error: null
        })

      renderAuthCallback()

      // Should eventually succeed
      await waitFor(() => {
        expect(screen.getByText('Sign-in successful! Redirecting to your dashboard...')).toBeInTheDocument()
      }, { timeout: 6000 })

      // Should have called getSession multiple times
      expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(2)
    })
  })

  describe('OAuth Error Handling', () => {
    it('should handle access_denied error', async () => {
      // Mock URL with access_denied error
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:5173/auth/callback?error=access_denied&error_description=User denied access',
          search: '?error=access_denied&error_description=User denied access',
          hash: ''
        },
        writable: true
      })

      renderAuthCallback()

      // Should show user-friendly error message
      await waitFor(() => {
        expect(screen.getByText('Sign-in was cancelled. You can try again if you\'d like.')).toBeInTheDocument()
      })

      // Should navigate back to login with error
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/?error=access_denied', { replace: true })
      }, { timeout: 4000 })
    })

    it('should handle invalid_request error', async () => {
      // Mock URL with invalid_request error
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:5173/auth/callback?error=invalid_request',
          search: '?error=invalid_request',
          hash: ''
        },
        writable: true
      })

      renderAuthCallback()

      // Should show configuration error message
      await waitFor(() => {
        expect(screen.getByText('Invalid sign-in request. Please contact support if this continues.')).toBeInTheDocument()
      })
    })

    it('should handle server_error', async () => {
      // Mock URL with server_error
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:5173/auth/callback?error=server_error',
          search: '?error=server_error',
          hash: ''
        },
        writable: true
      })

      renderAuthCallback()

      // Should show server error message
      await waitFor(() => {
        expect(screen.getByText('Server error during sign-in. Please try again in a moment.')).toBeInTheDocument()
      })
    })

    it('should handle session errors', async () => {
      // Mock session error
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Network error during session establishment')
      })

      renderAuthCallback()

      // Should show session error message
      await waitFor(() => {
        expect(screen.getByText('Failed to establish your session. Please try signing in again.')).toBeInTheDocument()
      }, { timeout: 10000 })

      // Should navigate back to login with error
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/?error=session_error', { replace: true })
      }, { timeout: 4000 })
    }, 15000)

    it('should handle no session after callback', async () => {
      // Mock no session and no error
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      renderAuthCallback()

      // Should show no session error message
      await waitFor(() => {
        expect(screen.getByText('No active session found. Please try signing in again.')).toBeInTheDocument()
      }, { timeout: 10000 })

      // Should navigate back to login with error
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/?error=no_session', { replace: true })
      }, { timeout: 4000 })
    }, 15000)
  })

  describe('Timeout Handling', () => {
    it('should handle authentication timeout', async () => {
      // Mock slow session response
      mockSupabase.auth.getSession.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { session: null }, error: null }), 6000))
      )

      renderAuthCallback()

      // Should show timeout message
      await waitFor(() => {
        expect(screen.getByText('Sign-in is taking longer than expected')).toBeInTheDocument()
      }, { timeout: 10000 })

      // Should show timeout UI with retry options
      expect(screen.getByText('This might be due to a slow connection.')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Use Different Sign-in Method')).toBeInTheDocument()
    }, 15000)
  })

  describe('URL Processing', () => {
    it('should detect OAuth errors in URL hash', async () => {
      // Mock URL with error in hash
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:5173/auth/callback#error=access_denied',
          search: '',
          hash: '#error=access_denied'
        },
        writable: true
      })

      renderAuthCallback()

      // Should handle hash-based error
      await waitFor(() => {
        expect(screen.getByText('Sign-in was cancelled. You can try again if you\'d like.')).toBeInTheDocument()
      })
    })

    it('should clean up OAuth URL after processing', async () => {
      // Mock successful session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'test-user-123',
              app_metadata: { provider: 'google' }
            }
          }
        },
        error: null
      })

      renderAuthCallback()

      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.getByText('Sign-in successful! Redirecting to your dashboard...')).toBeInTheDocument()
      }, { timeout: 6000 })

      // Should clean up OAuth URL
      expect(mockOAuthErrorRecovery.cleanupOAuthUrl).toHaveBeenCalled()
    })
  })

  describe('User Feedback', () => {
    it('should show appropriate loading states', async () => {
      // Mock delayed session response
      mockSupabase.auth.getSession.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            data: {
              session: {
                user: {
                  id: 'test-user-123',
                  app_metadata: { provider: 'google' }
                }
              }
            },
            error: null
          }), 1000)
        )
      )

      renderAuthCallback()

      // Should show initial processing message (component starts with verification)
      expect(screen.getByText('Verifying your authentication...')).toBeInTheDocument()

      // Should show verification message
      await waitFor(() => {
        expect(screen.getByText('Verifying your authentication...')).toBeInTheDocument()
      })

      // Should eventually show success
      await waitFor(() => {
        expect(screen.getByText('Sign-in successful! Redirecting to your dashboard...')).toBeInTheDocument()
      }, { timeout: 6000 })
    })

    it('should show success checkmark icon', async () => {
      // Mock successful session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'test-user-123',
              app_metadata: { provider: 'google' }
            }
          }
        },
        error: null
      })

      renderAuthCallback()

      // Wait for success state
      await waitFor(() => {
        expect(screen.getByText('Sign-in successful! Redirecting to your dashboard...')).toBeInTheDocument()
      }, { timeout: 6000 })

      // Should show success icon (green background)
      const successContainer = document.querySelector('.bg-green-500')
      expect(successContainer).toBeInTheDocument()
    })

    it('should show error icon for failures', async () => {
      // Mock URL with error
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:5173/auth/callback?error=access_denied',
          search: '?error=access_denied',
          hash: ''
        },
        writable: true
      })

      renderAuthCallback()

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Sign-in was cancelled. You can try again if you\'d like.')).toBeInTheDocument()
      })

      // Should show error icon (red background)
      const errorContainer = document.querySelector('.bg-red-500')
      expect(errorContainer).toBeInTheDocument()
    })
  })
})