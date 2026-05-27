import type { Metadata } from 'next';

import './globals.css';

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
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-screen bg-[#141414] text-white">{children}</body>
    </html>
  );
}
