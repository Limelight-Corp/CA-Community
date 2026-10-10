/** Small JSON fetch wrapper for admin client components (same-origin, credentials included). */

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function api<T = unknown>(
  url: string,
  init: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown } = {}
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: init.method ?? 'GET',
      headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (res.status === 401 && typeof window !== 'undefined') {
      // Session expired: send the admin back to sign in, then return here.
      const here = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/login?next=${encodeURIComponent(here)}`);
    }
    if (!res.ok || !json || json.success === false) {
      return {
        ok: false,
        status: res.status,
        error: (json?.error as string) || `Request failed (${res.status})`,
        fieldErrors: (json?.fieldErrors as Record<string, string>) || undefined,
      };
    }
    return { ok: true, status: res.status, data: (json.item ?? json.data ?? json) as T };
  } catch {
    return { ok: false, status: 0, error: 'Network error — check your connection and try again.' };
  }
}

/** Builds a query string from non-empty values. */
export function qs(params: Record<string, string | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : '';
}
