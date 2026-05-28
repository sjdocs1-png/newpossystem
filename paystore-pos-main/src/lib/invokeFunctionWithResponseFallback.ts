import { supabase } from '@/integrations/supabase/client';

type EdgeResponseLike = {
  clone?: () => EdgeResponseLike;
  status?: number;
  text?: () => Promise<string>;
};

const isResponseLike = (value: unknown): value is EdgeResponseLike => {
  return typeof value === 'object' && value !== null && 'status' in value && 'text' in value;
};

const parseResponseBody = async <T>(response: EdgeResponseLike): Promise<T | null> => {
  const clone = typeof response.clone === 'function' ? response.clone() : response;
  const text = typeof clone.text === 'function' ? await clone.text() : '';
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

export async function invokeFunctionWithResponseFallback<TResponse>(
  functionName: string,
  body: Record<string, unknown>
): Promise<TResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  if (!token) {
    console.warn(`invokeFunctionWithResponseFallback: missing auth token for function ${functionName}`);
  }

  try {
    console.debug(`[invokeFunctionWithResponseFallback] function=${functionName} request body=`, body);

    const headers = {
      'Content-Type': 'application/json',
      ...authHeaders,
    } as Record<string, string>;

    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers,
    });

    if (!error) {
      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid function response');
      }

      const typedData = data as TResponse & { error?: string; success?: boolean };
      console.debug(`[invokeFunctionWithResponseFallback] function=${functionName} response data=`, typedData);

      if (typedData.error) {
        throw new Error(String(typedData.error));
      }
      if (typedData.success === false) {
        throw new Error(String(typedData.error || 'Request failed'));
      }

      return typedData;
    }

    const response = (error as { context?: unknown }).context;
    if (isResponseLike(response)) {
      const parsed = await parseResponseBody<TResponse & { error?: string; success?: boolean }>(response);
      console.debug(`[invokeFunctionWithResponseFallback] function=${functionName} response fallback parsed=`, parsed);

      if (response.status && response.status >= 200 && response.status < 300 && parsed && typeof parsed === 'object') {
        if (parsed.error) {
          throw new Error(String(parsed.error));
        }
        if (parsed.success === false) {
          throw new Error(String(parsed.error || 'Request failed'));
        }
        return parsed as TResponse;
      }

      const warningPayload = parsed ?? { success: false, warning: 'Request failed' };
      console.warn(`[invokeFunctionWithResponseFallback] function=${functionName} warning response=`, warningPayload);
      return warningPayload as unknown as TResponse;
    }

    throw new Error((error as Error)?.message || 'Function invocation failed');
  } catch (err) {
    console.error(`[invokeFunctionWithResponseFallback] function=${functionName} error=`, err);
    throw err;
  }
}
