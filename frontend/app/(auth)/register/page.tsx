'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, MapPin, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface FormErrors {
  username?: string;
  email?: string;
  displayName?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(fields: {
  username: string;
  email: string;
  displayName: string;
  password: string;
  confirmPassword: string;
}): FormErrors {
  const errors: FormErrors = {};
  if (!fields.username) errors.username = 'Username is required';
  else if (!/^[a-z0-9_]{3,20}$/.test(fields.username))
    errors.username = '3–20 chars, lowercase letters, numbers, underscores only';

  if (!fields.email) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
    errors.email = 'Invalid email address';

  if (!fields.displayName) errors.displayName = 'Display name is required';
  else if (fields.displayName.length < 2)
    errors.displayName = 'At least 2 characters';

  if (!fields.password) errors.password = 'Password is required';
  else if (fields.password.length < 6)
    errors.password = 'At least 6 characters';

  if (!fields.confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (fields.confirmPassword !== fields.password)
    errors.confirmPassword = 'Passwords do not match';

  return errors;
}

function FieldStatus({ valid, error }: { valid: boolean; error?: string }) {
  if (error) return <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><XCircle size={12} />{error}</p>;
  if (valid) return <CheckCircle size={14} className="text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />;
  return null;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: '',
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = validate(form);
  const hasError = (field: keyof FormErrors) => touched[field] && errors[field];
  const isValid = (field: keyof FormErrors) => touched[field] && !errors[field] && (form as Record<string, string>)[field];

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const blur = (field: string) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, email: true, displayName: true, password: true, confirmPassword: true });
    if (Object.keys(errors).length > 0) return;
    setIsLoading(true);
    try {
      await register(form);
    } catch (err) {
      const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors && typeof fieldErrors === 'object') {
        const firstMsg = Object.values(fieldErrors).flat()[0];
        toast.error(firstMsg || error.response?.data?.message || 'Validation failed');
      } else {
        toast.error(error.response?.data?.message ?? 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg mb-4">
            <MapPin className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-500 mt-1 text-sm">Join FriendMap today</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.displayName}
                  onChange={set('displayName')}
                  onBlur={blur('displayName')}
                  placeholder="Your Name"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition text-gray-900 placeholder-gray-400 ${hasError('displayName') ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'}`}
                />
                {isValid('displayName') && <CheckCircle size={14} className="text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />}
              </div>
              {hasError('displayName') && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><XCircle size={12} />{errors.displayName}</p>}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.username}
                  onChange={set('username')}
                  onBlur={blur('username')}
                  placeholder="yourname123"
                  autoComplete="username"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition text-gray-900 placeholder-gray-400 ${hasError('username') ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'}`}
                />
                {isValid('username') && <CheckCircle size={14} className="text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />}
              </div>
              {hasError('username') && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><XCircle size={12} />{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  onBlur={blur('email')}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition text-gray-900 placeholder-gray-400 ${hasError('email') ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'}`}
                />
                {isValid('email') && <CheckCircle size={14} className="text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />}
              </div>
              {hasError('email') && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><XCircle size={12} />{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  onBlur={blur('password')}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition text-gray-900 placeholder-gray-400 pr-12 ${hasError('password') ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'}`}
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {hasError('password') && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><XCircle size={12} />{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  onBlur={blur('confirmPassword')}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition text-gray-900 placeholder-gray-400 pr-12 ${hasError('confirmPassword') ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'}`}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {hasError('confirmPassword') && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><XCircle size={12} />{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (<><Loader2 className="animate-spin" size={18} />Creating account…</>) : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
