import { NextResponse } from "next/server";

export function ok<T>(data: T) {
  return NextResponse.json({ data }, { status: 200 });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function okPaginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return NextResponse.json({ data, total, page, pageSize }, { status: 200 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: { message, details } }, { status: 400 });
}

export function unauthorized(message = "Authentication required") {
  return NextResponse.json({ error: { message } }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: { message } }, { status: 403 });
}

export function notFound(message = "Resource not found") {
  return NextResponse.json({ error: { message } }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: { message } }, { status: 409 });
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function handleApiError(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json(
      { error: { message: err.message } },
      { status: err.status },
    );
  }
  console.error(err);
  return NextResponse.json(
    { error: { message: "Internal server error" } },
    { status: 500 },
  );
}
