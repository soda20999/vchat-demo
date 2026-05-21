import type { Metadata } from 'next';

// 文件作用：定义应用根布局，挂载全局样式、侧边栏和初始化组件。
import { Sidebar } from '@/components/Chat/Sidebar';

import { RootLayoutInitializer } from './RootLayoutInitializer';
import './globals.css';

export const metadata: Metadata = {
  title: 'VChat',
  description: 'AI Chat Application',
};

// 函数名：RootLayout；简单介绍：包裹所有页面内容，并提供应用级公共布局；参数变量名：children。
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <body className="flex h-screen overflow-hidden bg-[#141414]">
        <RootLayoutInitializer />
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
