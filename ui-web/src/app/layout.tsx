import type { Metadata } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { LocaleProvider } from '@/lib/i18n';

// SF Pro is Apple's proprietary system font — it can't be self-hosted or
// loaded via next/font/google. The system-font stack in globals.css
// (--font-sans / --font-display) renders as real SF Pro on Mac/iOS and
// falls back gracefully elsewhere, which is the standard way to "use" it.
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ConnectOne: Integrated Internal Work Management',
  description: 'Integrated internal work management platform for productive teams',
  icons: { icon: '/logo-only-black.png' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plexMono.variable}>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <LocaleProvider>
          <Providers>{children}</Providers>
        </LocaleProvider>
      </body>
    </html>
  );
}
