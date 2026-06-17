import { NextResponse } from 'next/server';
import { encodeSseEvent, type ChatStreamErrorEvent } from '@/lib/sse-stream';

type StreamErrorEvent = ChatStreamErrorEvent;

export function getErrorMessage(
  error: unknown,
  fallback = 'Internal Server Error'
) {
  return error instanceof Error ? error.message : fallback;
}

export function encodeStreamEvent<T extends { type?: string }>(event: T) {
  return encodeSseEvent(event);
}

export function jsonSuccessResponse<T>(
  data: T,
  message = 'Success',
  code = 200
) {
  return NextResponse.json({
    code,
    message,
    data,
    timestamp: Date.now(),
  });
}

export function jsonErrorResponse(message: string, code = 500) {
  return NextResponse.json({
    code,
    message,
    timestamp: Date.now(),
  });
}

export function jsonExceptionResponse(
  error: unknown,
  fallback = 'Internal Server Error',
  code = 500
) {
  console.error(fallback, error);
  return jsonErrorResponse(getErrorMessage(error, fallback), code);
}

export function streamResponse(
  stream: ReadableStream<Uint8Array>,
  headers?: HeadersInit
) {
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      ...headers,
    },
  });
}

export function streamErrorResponse(message: string) {
  return streamResponse(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encodeStreamEvent<StreamErrorEvent>({
          type: 'error',
          message,
        }));
        controller.close();
      },
    })
  );
}

export async function writeStreamError(
  controller: ReadableStreamDefaultController<Uint8Array>,
  error: unknown,
  fallback = 'Internal Server Error',
  beforeWrite?: () => Promise<void>
) {
  try {
    await beforeWrite?.();
  } catch (cleanupError) {
    console.error('Stream error cleanup failed:', cleanupError);
  }

  controller.enqueue(encodeStreamEvent<StreamErrorEvent>({
    type: 'error',
    message: getErrorMessage(error, fallback),
  }));
  controller.close();
}
