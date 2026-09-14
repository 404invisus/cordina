import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { LocaleProvider } from '@/lib/i18n';

// Font monospace mengandalkan stack sistem (ui-monospace) supaya build
// tidak bergantung ke fonts.googleapis.com — VM di jaringan internal
// tidak punya akses keluar, jadi next/font/google akan gagal saat build.

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
    <html lang="id">
      <body className="antialiased font-sans" suppressHydrationWarning>
        <LocaleProvider>
          <Providers>{children}</Providers>
        </LocaleProvider>
      </body>
    </html>
  );
}
