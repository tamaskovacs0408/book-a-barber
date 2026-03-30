export async function apiFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) throw new Error(`Request failed with status: ${response.status}`);

  return response.json();
}

export class AppError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "AppError"

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}

export const HttpStatusCode = {
  Ok: 200,
  BadRequest: 400,
  NotFound: 404,
  Conflict: 409,
  InternalServerError: 500,
} as const