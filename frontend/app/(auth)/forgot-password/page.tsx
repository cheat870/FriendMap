'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // Simulate reset request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-3">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ភ្លេចពាក្យសម្ងាត់</h1>
          <p className="text-sm text-gray-500 mt-1">Reset Password</p>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">តំណភ្ជាប់ត្រូវបានផ្ញើ!</h3>
            <p className="text-sm text-gray-500 mt-2 mb-6">
              យើងបានផ្ញើតំណភ្ជាប់កំណត់ពាក្យសម្ងាត់ឡើងវិញទៅកាន់ {email}
            </p>
            <Link href="/login">
              <Button fullWidth variant="primary">ត្រឡប់ទៅទំព័រចូល (Back to Login)</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4 text-center">
              សូមបញ្ចូលអ៊ីមែលរបស់អ្នកដើម្បីទទួលបានតំណកំណត់ពាក្យសម្ងាត់ឡើងវិញ។
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                អ៊ីមែល (Email)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <Button type="submit" fullWidth loading={loading} variant="primary">
              ផ្ញើតំណកំណត់ឡើងវិញ (Send Reset Link)
            </Button>

            <div className="text-center mt-4">
              <Link
                href="/login"
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                ត្រឡប់ទៅការចូល (Back to Login)
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
