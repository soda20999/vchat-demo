import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { Sidebar } from '@/components/Chat/Sidebar';

import { RootLayoutInitializer } from './RootLayoutInitializer';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'VChat',
  description: 'AI Chat Application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-screen overflow-hidden bg-[#141414]">
        <RootLayoutInitializer />
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
