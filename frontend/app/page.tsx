'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Navigation, Users, Shield, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/map');
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-cyan-50/30 flex flex-col justify-between">
      {/* Header */}
      <header className="h-20 max-w-5xl mx-auto w-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <MapPin className="w-5 h-5" />
          </div>
          <span className="font-black text-xl text-gray-900 tracking-tight">FriendMap</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-bold text-xs">
              ចូលប្រើ (Log In)
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm" className="font-bold text-xs shadow-md shadow-indigo-200">
              ចុះឈ្មោះ (Sign Up)
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 py-12 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-Time GPS Location Sharing & Navigation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight leading-tight max-w-2xl">
          ភ្ជាប់ទំនាក់ទំនងជាមួយ <span className="text-indigo-600">មិត្តភក្តិរបស់អ្នក</span> នៅលើផែនទីផ្ទាល់
        </h1>

        <p className="text-base sm:text-lg text-gray-600 mt-5 max-w-xl leading-relaxed">
          FriendMap គឺជាវេទិកាចែករំលែកទីតាំង និងនាំផ្លូវពេលវេលាជាក់ស្តែង (Real-Time) ដែលមានសុវត្ថិភាពខ្ពស់ ងាយស្រួលស្វែងរក និងនាំផ្លូវទៅកាន់មិត្តភក្តិ។
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3.5 mt-8 w-full max-w-sm justify-center">
          <Link href="/register" className="w-full sm:w-auto flex-1">
            <Button variant="primary" size="lg" fullWidth className="rounded-2xl font-bold shadow-xl shadow-indigo-200 flex items-center justify-center gap-2">
              <span>ចាប់ផ្តើមឥឡូវនេះ (Get Started)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto flex-1">
            <Button variant="outline" size="lg" fullWidth className="rounded-2xl font-bold border-gray-200">
              ចូលគណនី (Sign In)
            </Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 w-full text-left">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">ទីតាំងផ្ទាល់ (Live GPS)</h3>
            <p className="text-xs text-gray-500 mt-1">
              មើលទីតាំងផ្ទាល់របស់មិត្តភក្តិដែលបានយល់ព្រមនៅលើផែនទីអន្តរកម្ម។
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
              <Navigation className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">នាំផ្លូវ (Turn-by-Turn)</h3>
            <p className="text-xs text-gray-500 mt-1">
              គណនាផ្លូវពិតប្រាកដតាមផ្លូវថ្នល់ និងការជូនដំណឹងនៅពេលមកដល់។
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">សុវត្ថិភាព & ឯកជនភាព</h3>
            <p className="text-xs text-gray-500 mt-1">
              អ្នកមានសិទ្ធិពេញលេញក្នុងការបើក ផ្អាក ឬកំណត់រយៈពេលចែករំលែក។
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-100 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} FriendMap. Built with Next.js, Leaflet & Socket.IO.
      </footer>
    </div>
  );
}
