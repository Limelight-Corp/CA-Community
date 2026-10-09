import { NextResponse } from 'next/server';
import { ActionError } from './admin-data';

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function bad(message: string, status = 400, fieldErrors?: Record<string, string>) {
  return NextResponse.json({ success: false, error: message, fieldErrors }, { status });
}

export function handleError(error: unknown, label: string) {
  if (error instanceof ActionError) return bad(error.message, error.status);
  console.error(`${label} error:`, error);
  return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
}
