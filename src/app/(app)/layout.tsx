import { Sidebar } from '@/components/Chat/Sidebar';

import { RootLayoutInitializer } from '../RootLayoutInitializer';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#141414]">
      <RootLayoutInitializer />
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
