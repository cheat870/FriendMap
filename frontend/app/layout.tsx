import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Khmer } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { LocationProvider } from '@/contexts/LocationContext';
import 'leaflet/dist/leaflet.css';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansKhmer = Noto_Sans_Khmer({
  subsets: ['khmer'],
  variable: '--font-noto-khmer',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'FriendMap – Share Your World',
    template: '%s | FriendMap',
  },
  description: 'Share your real-time location with friends and stay connected wherever you are.',
  keywords: ['location sharing', 'friend tracking', 'real-time map', 'FriendMap'],
  authors: [{ name: 'FriendMap Team' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4F46E5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansKhmer.variable}`}>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">
        <QueryProvider>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-google-client-id.apps.googleusercontent.com'}>
            <AuthProvider>
              <SocketProvider>
                <LocationProvider>
                  {children}
                  <Toaster
                    position="top-center"
                    gutter={8}
                    toastOptions={{
                      duration: 3500,
                      style: {
                        background: '#1f2937',
                        color: '#f9fafb',
                        borderRadius: '12px',
                        fontSize: '14px',
                      },
                      success: {
                        iconTheme: { primary: '#10B981', secondary: '#fff' },
                      },
                      error: {
                        iconTheme: { primary: '#EF4444', secondary: '#fff' },
                      },
                    }}
                  />
                </LocationProvider>
              </SocketProvider>
            </AuthProvider>
          </GoogleOAuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
