/**
 * Login Page
 * 
 * Beautiful sign-in page with Google authentication via Firebase.
 * Shown when the user is not authenticated.
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function Login() {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Sign-in failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          'linear-gradient(135deg, hsl(220 60% 12%) 0%, hsl(240 50% 8%) 50%, hsl(260 60% 12%) 100%)',
      }}
    >
      {/* Ambient glow effects */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 600px 400px at 30% 20%, hsla(220, 90%, 50%, 0.08), transparent), radial-gradient(ellipse 500px 350px at 70% 80%, hsla(260, 90%, 50%, 0.06), transparent)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, hsl(220 80% 55%), hsl(260 80% 60%))',
              boxShadow: '0 8px 32px hsla(240, 80%, 50%, 0.3)',
            }}
          >
            <span className="text-3xl">🏭</span>
          </div>
          <h1
            className="text-3xl font-bold tracking-tight mb-2"
            style={{ color: 'hsl(0 0% 95%)' }}
          >
            FactoryMind AI
          </h1>
          <p style={{ color: 'hsl(220 15% 55%)' }} className="text-sm">
            Intelligent Operations Assistant
          </p>
        </div>

        {/* Sign-in Card */}
        <Card
          className="p-8 border-0"
          style={{
            background: 'hsla(220, 30%, 15%, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid hsla(220, 40%, 30%, 0.3)',
            boxShadow:
              '0 24px 48px hsla(0, 0%, 0%, 0.4), 0 0 0 1px hsla(220, 40%, 30%, 0.2)',
          }}
        >
          <div className="text-center mb-6">
            <h2
              className="text-xl font-semibold mb-1"
              style={{ color: 'hsl(0 0% 92%)' }}
            >
              Welcome back
            </h2>
            <p style={{ color: 'hsl(220 15% 55%)' }} className="text-sm">
              Sign in to access your workspace
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm text-center"
              style={{
                background: 'hsla(0, 70%, 50%, 0.1)',
                border: '1px solid hsla(0, 70%, 50%, 0.2)',
                color: 'hsl(0, 80%, 70%)',
              }}
            >
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 text-base font-medium rounded-xl transition-all duration-200"
            style={{
              background: isLoading
                ? 'hsla(220, 30%, 20%, 0.5)'
                : 'hsl(0 0% 100%)',
              color: isLoading ? 'hsl(220 15% 55%)' : 'hsl(220 10% 20%)',
              border: '1px solid hsla(220, 30%, 40%, 0.2)',
              boxShadow: isLoading ? 'none' : '0 2px 8px hsla(0, 0%, 0%, 0.2)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow =
                  '0 4px 16px hsla(0, 0%, 0%, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '0 2px 8px hsla(0, 0%, 0%, 0.2)';
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <svg
                  className="w-5 h-5"
                  style={{ animation: 'spin 1s linear infinite' }}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray="60"
                    strokeLinecap="round"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                {/* Google "G" logo */}
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </span>
            )}
          </Button>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <div
              className="flex-1 h-px"
              style={{ background: 'hsla(220, 30%, 30%, 0.4)' }}
            />
            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: 'hsl(220 15% 40%)' }}
            >
              secure sign-in
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: 'hsla(220, 30%, 30%, 0.4)' }}
            />
          </div>

          {/* Trust indicators */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'hsl(220 15% 45%)' }}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-xs" style={{ color: 'hsl(220 15% 45%)' }}>
                Encrypted
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'hsl(220 15% 45%)' }}
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-xs" style={{ color: 'hsl(220 15% 45%)' }}>
                Firebase Auth
              </span>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p
          className="text-center mt-6 text-xs"
          style={{ color: 'hsl(220 15% 35%)' }}
        >
          Built with ❤️ by Shashank •{' '}
          <a
            href="https://github.com/shashankpc7746/FactoryMind-AI"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'hsl(220 60% 55%)' }}
            className="hover:underline"
          >
            GitHub
          </a>
        </p>
      </div>

      {/* Spin animation for loading spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
