/**
 * @file user.ts
 * @description 用户相关的类型定义
 */

/**
 * 用户基础信息
 */
export interface User {
  id: string;
  username: string;
  email: string;
  signature: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 用户注册时的请求数据
 */
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

/**
 * 用户登录时的请求数据
 */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * 用户登录成功的响应数据
 */
export interface LoginResponse {
  user: User;
  token: string; // JWT token
}

/**
 * 用户个人资料更新请求
 */
export interface UpdateUserProfilePayload {
  username?: string;
  signature?: string;
}

/**
 * 用户密码更新请求
 */
export interface UpdateUserPasswordPayload {
  oldPassword: string;
  newPassword: string;
}

/**
 * 用户相关错误类型
 */
export type UserErrorType =
  | 'EMAIL_ALREADY_EXISTS'
  | 'USERNAME_ALREADY_EXISTS'
  | 'INVALID_EMAIL'
  | 'INVALID_PASSWORD'
  | 'USER_NOT_FOUND'
  | 'WRONG_PASSWORD'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED';

/**
 * API 响应数据格式
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
  error?: UserErrorType;
}

/**
 * 向后兼容的类型别名
 */
export type UserProps = User;
