'use client';

// 文件作用：渲染设置页占位内容，后续可扩展用户配置项。
import React from 'react';

/**
 * Settings 页面
 */
// 函数名：SettingsPage；简单介绍：展示设置页面的基础占位界面。
export default function SettingsPage() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">设置</h1>
        <p className="text-gray-500">设置页面开发中...</p>
      </div>
    </div>
  );
}
