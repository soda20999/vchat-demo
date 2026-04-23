/**
 * GET /api/providers - 获取所有AI模型提供商
 */

import { NextRequest, NextResponse } from 'next/server';
import * as providerService from '../../../db/service/provide';
import { successResponse, internalErrorResponse } from '../../../lib/server-response';

/**
 * GET - 获取所有提供商
 */
export async function GET(req: NextRequest) {
  try {
    const providers = await providerService.getAllProviders();

    return NextResponse.json(
      successResponse(providers, '获取提供商列表成功'),
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/providers error:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(internalErrorResponse(msg), { status: 500 });
  }
}
