import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AudioProvider } from '@/context/AudioContext';

export const metadata: Metadata = {
  title: 'SonicVault - Personal MP3 Music Player PWA',
  description: 'Fast, offline-ready personal MP3 music player with lock screen media controls and IndexedDB storage.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SonicVault',
  },
  icons: {
    icon: '/icons/favicon.svg',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#090d16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-background text-slate-100 min-h-screen">
        <AudioProvider>
          {children}
        </AudioProvider>

        {/* Register Service Worker for PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('SonicVault ServiceWorker registered: ', registration.scope);
                    },
                    function(err) {
                      console.log('SonicVault ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
