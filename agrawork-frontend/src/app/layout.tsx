import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Agrawork — Project Management",
  description: "Platform manajemen proyek modern untuk tim yang produktif",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '14px',
                borderRadius: '10px',
              },
              success: {
                iconTheme: { primary: '#284074', secondary: '#fff' },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
