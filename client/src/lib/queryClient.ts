import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // Even if response is not ok, we still return it instead of throwing
    // This allows callers to handle different status codes appropriately
    if (!res.ok) {
      console.warn(`API request failed: ${method} ${url} - Status: ${res.status}`);
    }
    
    return res;
  } catch (error) {
    // Handle network errors (offline, CORS, etc.)
    console.error(`Network error during API request: ${method} ${url}`, error);
    // Create a synthetic Response object to represent the network error
    const errorResponse = new Response(JSON.stringify({ 
      message: "Network error, please check your connection" 
    }), {
      status: 0,
      statusText: "Network Error",
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
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      if (!res.ok) {
        const text = await res.text();
        const message = text || res.statusText;
        
        console.warn(`Query failed for ${queryKey[0]}: ${res.status} - ${message}`);
        
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
