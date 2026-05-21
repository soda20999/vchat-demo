'use client';

// 文件作用：把表单字段 key 转换成更友好的中文标签展示。
const LABEL_MAP: Record<string, string> = {
  mode: '\u804a\u5929\u6a21\u5f0f',
  style: '\u56de\u590d\u98ce\u683c',
  length: '\u56de\u590d\u957f\u5ea6',
};

// 函数名：FormTag；简单介绍：显示字段标签，优先使用 LABEL_MAP 中的中文名称；参数变量名：label。
export function FormTag({ label }: { label: string }) {
  return <span className="text-xs text-gray-400">{LABEL_MAP[label] ?? label}</span>;
}
