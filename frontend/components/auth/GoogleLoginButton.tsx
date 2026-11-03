'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface GoogleLoginButtonProps {
  mode?: 'signin' | 'signup';
  text?: string;
}

export default function GoogleLoginButton({
  mode = 'signin',
  text,
}: GoogleLoginButtonProps) {
  const { googleLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConfigNotice, setShowConfigNotice] = useState(false);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '715090036708-djgkdmqpurkmoafrkav99tom32eu5m71.apps.googleusercontent.com';

  // Real Google OAuth flow
  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        await googleLogin({
          accessToken: tokenResponse.access_token,
        });
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      loggerError('Google Auth Error:', error);
      toast.error('Google sign-in was cancelled or failed');
      setLoading(false);
    },
  });

  const handleClick = () => {
    setLoading(true);
    handleGoogleAuth();
  };

  const handleDemoGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Simulate Google OAuth login in dev/testing
      await googleLogin({
        idToken: 'demo-google-token',
      });
    } catch {
      toast.error('Google sign-in failed');
    } finally {
      setLoading(false);
      setShowConfigNotice(false);
    }
  };

  const defaultText =
    mode === 'signup'
      ? 'ចុះឈ្មោះជាមួយ Google (Sign up with Google)'
      : 'ចូលប្រើជាមួយ Google (Continue with Google)';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 active:scale-[0.99] text-gray-700 font-medium text-sm transition shadow-sm hover:shadow disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{text || defaultText}</span>
      </button>

      {/* Modal if Google Client ID is not yet configured */}
      {showConfigNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-900 text-center">
              Google Sign-In Setup
            </h3>

            <p className="text-sm text-gray-600 leading-relaxed">
              ដើម្បីប្រើ Google Sign-In ពិតប្រាកដ សូមបន្ថែម <strong>Google Client ID</strong> របស់អ្នកក្នុង Vercel & Render Environment Variables៖
            </p>

            <div className="bg-gray-50 rounded-xl p-3 text-xs font-mono text-gray-800 break-all select-all border">
              NEXT_PUBLIC_GOOGLE_CLIENT_ID=&lt;your-google-client-id&gt;
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfigNotice(false)}
                className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition"
              >
                យល់ព្រម (Got it)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function loggerError(...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(...args);
  }
}
