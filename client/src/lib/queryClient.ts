import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getApiBaseUrl } from "./api-config";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // Ensure URL is relative to current domain when deployed
    const baseUrl = getApiBaseUrl();
    const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;



    const res = await fetch(fullUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // Even if response is not ok, we still return it instead of throwing
    // This allows callers to handle different status codes appropriately
    if (!res.ok) {
      console.warn(`API request failed: ${method} ${fullUrl} - Status: ${res.status}`);
    }

    return res;
  } catch (error) {
    // Handle network errors (offline, CORS, etc.)
    console.error(`Network error during API request: ${method} ${url}`, error);
    // Create a synthetic Response object to represent the network error
    const errorResponse = new Response(JSON.stringify({
      message: "Network error, please check your connection"
    }), {
      status: 503,
      statusText: "Service Unavailable",
      headers: { 'Content-Type': 'application/json' }
    });

    return errorResponse;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      try {
        // Use the same URL handling logic as apiRequest
        const baseUrl = getApiBaseUrl();
        const url = queryKey[0] as string;
        let fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;

        // Append query parameters from queryKey[1] if present
        if (queryKey[1] && typeof queryKey[1] === 'object') {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(queryKey[1] as Record<string, any>)) {
            if (value !== undefined && value !== null) {
              params.append(key, String(value));
            }
          }
          const qs = params.toString();
          if (qs) {
            fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
          }
        }

        const res = await fetch(fullUrl, {
          credentials: "include",
        });

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }

        if (!res.ok) {
          const text = await res.text();
          const message = text || res.statusText;

          console.warn(`Query failed for ${fullUrl}: ${res.status} - ${message}`);

          // On rate limit, don't throw — let React Query keep previous data
          if (res.status === 429) {
            console.warn(`Rate limited on ${fullUrl}, keeping previous data`);
            return undefined as any;
          }

          if (res.status === 500) {
            throw new Error("Server error. Please try again later.");
          } else {
            throw new Error(`Request failed: ${message}`);
          }
        }

        return await res.json();
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Query error for ${queryKey[0]}:`, error.message);
          throw error;
        }

        console.error(`Unknown query error for ${queryKey[0]}:`, error);
        throw new Error("An unexpected error occurred. Please try again.");
      }
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
