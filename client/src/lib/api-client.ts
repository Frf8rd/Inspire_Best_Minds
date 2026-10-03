import { API_URL } from './env';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
type Options = { method?: Method; body?: unknown };

const SESSION_CODES = ['NO_TOKEN', 'TOKEN_EXPIRED', 'INVALID_TOKEN'];

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

let onUnauthorized: (() => void) | null = null;
/** Apelat când sesiunea nu mai poate fi reînnoită (ex. refresh token expirat). */
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

let refreshing: Promise<boolean> | null = null;
/** O singură reîmprospătare la un moment dat, chiar dacă mai multe cereri primesc 401 simultan. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function send(path: string, { method = 'GET', body }: Options): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include', // cookie-urile httpOnly ale backendului
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Nu ne putem conecta la server. Verifică conexiunea la internet.', 0, 'NETWORK');
  }
}

const readCode = (res: Response): Promise<string | undefined> =>
  res
    .clone()
    .json()
    .then((data: { code?: string }) => data.code)
    .catch(() => undefined);

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  let res = await send(path, options);

  if (res.status === 401) {
    let code = await readCode(res);
    if (code === 'TOKEN_EXPIRED' && (await refreshSession())) {
      res = await send(path, options);
      code = res.status === 401 ? await readCode(res) : undefined;
    }
    if (res.status === 401 && code && SESSION_CODES.includes(code)) onUnauthorized?.();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message ?? 'A apărut o eroare. Încearcă din nou.', res.status, data.code);
  }
  return data as T;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'Prea multe încercări. Așteaptă puțin și încearcă din nou.';
    return error.message;
  }
  return 'A apărut o eroare neașteptată. Încearcă din nou.';
}
