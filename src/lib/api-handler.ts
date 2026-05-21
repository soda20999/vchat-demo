/**
 * API 路由工具函数
 * 简化路由处理，统一错误和响应格式
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { jsonErrorResponse, jsonExceptionResponse } from './api-error';

export interface ApiHandlerContext {
  params?: Record<string, unknown>;
  searchParams?: Record<string, unknown>;
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
    return jsonExceptionResponse(error, 'API Error');
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
      error: jsonErrorResponse(message, 422),
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
      error: jsonErrorResponse('Unauthorized - Missing or invalid token', 401),
    };
  }
  return { userId };
}
