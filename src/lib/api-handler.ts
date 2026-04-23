/**
 * API 路由工具函数
 * 简化路由处理，统一错误和响应格式
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, z } from 'zod';
import { errorResponse, internalErrorResponse } from './server-response';

export interface ApiHandlerContext {
  params?: Record<string, any>;
  searchParams?: Record<string, any>;
}

/**
 * 包装异步 API 路由处理器
 */
export async function handleApiRequest(
  handler: (req: NextRequest, context: ApiHandlerContext) => Promise<NextResponse>,
  req: NextRequest,
  context?: ApiHandlerContext
): Promise<NextResponse> {
  try {
    return await handler(req, context || {});
  } catch (error) {
    console.error('API Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(internalErrorResponse(message), { status: 500 });
  }
}

/**
 * 验证请求体
 */
export async function validateRequestBody<T>(
  req: NextRequest,
  schema: ZodSchema
): Promise<{ data?: T; error?: NextResponse }> {
  try {
    const body = await req.json();
    const validated = schema.parse(body);
    return { data: validated as T };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Validation Error';
    return {
      error: NextResponse.json(errorResponse(422, message), { status: 422 }),
    };
  }
}

/**
 * 检查认证（placeholder）
 * TODO: 实现真实的认证逻辑（JWT 校验等）
 */
export async function checkAuth(req: NextRequest): Promise<string | null> {
  // 从 header 或 cookie 中获取用户ID
  const userId = req.headers.get('x-user-id');
  return userId;
}

/**
 * 要求认证
 */
export async function requireAuth(req: NextRequest): Promise<{ userId?: string; error?: NextResponse }> {
  const userId = await checkAuth(req);
  if (!userId) {
    return {
      error: NextResponse.json(
        errorResponse(401, 'Unauthorized - Missing or invalid token'),
        { status: 401 }
      ),
    };
  }
  return { userId };
}
