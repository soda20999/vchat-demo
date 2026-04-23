/**
 * API 响应标准化工具
 */

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp: number;
}

/**
 * 成功响应
 */
export function successResponse<T>(
  data: T,
  message: string = 'Success'
): ApiResponse<T> {
  return {
    code: 200,
    message,
    data,
    timestamp: Date.now(),
  };
}

/**
 * 错误响应
 */
export function errorResponse(
  code: number = 400,
  message: string = 'Error'
): ApiResponse {
  return {
    code,
    message,
    timestamp: Date.now(),
  };
}

/**
 * 创建资源成功（201）
 */
export function createdResponse<T>(
  data: T,
  message: string = 'Created'
): ApiResponse<T> {
  return {
    code: 201,
    message,
    data,
    timestamp: Date.now(),
  };
}

/**
 * 未认证（401）
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): ApiResponse {
  return errorResponse(401, message);
}

/**
 * 禁止访问（403）
 */
export function forbiddenResponse(message: string = 'Forbidden'): ApiResponse {
  return errorResponse(403, message);
}

/**
 * 资源不存在（404）
 */
export function notFoundResponse(message: string = 'Not Found'): ApiResponse {
  return errorResponse(404, message);
}

/**
 * 验证失败（422）
 */
export function validationErrorResponse(message: string = 'Validation Error'): ApiResponse {
  return errorResponse(422, message);
}

/**
 * 服务器错误（500）
 */
export function internalErrorResponse(message: string = 'Internal Server Error'): ApiResponse {
  return errorResponse(500, message);
}
