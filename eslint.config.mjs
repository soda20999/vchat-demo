import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const serverOnlyImports = [
  '@/db/**',
  '@/lib/auth/**',
  '@/lib/api-handler',
  '@/lib/server-response',
  '@/app/api/**',
  '../db/**',
  '../../db/**',
  '../../../db/**',
  '../lib/auth/**',
  '../../lib/auth/**',
  '../../../lib/auth/**',
  '../lib/api-handler',
  '../../lib/api-handler',
  '../../../lib/api-handler',
  '../lib/server-response',
  '../../lib/server-response',
  '../../../lib/server-response',
  '../app/api/**',
  '../../app/api/**',
  '../../../app/api/**',
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['src/components/**/*.{ts,tsx}', 'src/stores/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: serverOnlyImports,
              message:
                '前端组件和 store 不应直接引用 DB、服务端 auth、Route Handler 或服务端响应封装。请通过前端 API client、共享 schema 或纯类型边界传递数据。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/types/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                ...serverOnlyImports,
                '@/components/**',
                '@/stores/**',
                '@/app/**',
                '../components/**',
                '../../components/**',
                '../stores/**',
                '../../stores/**',
                '../app/**',
                '../../app/**',
              ],
              message: 'types 目录只能放纯类型或共享契约，不应依赖组件、store、页面或服务端实现。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/db/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/components/**',
                '@/stores/**',
                '@/app/**',
                '../components/**',
                '../../components/**',
                '../stores/**',
                '../../stores/**',
                '../app/**',
                '../../app/**',
              ],
              message:
                'DB 层不应反向依赖组件、store 或 app 页面层。请把共享类型放到 src/types，把业务编排放到更高层。',
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
