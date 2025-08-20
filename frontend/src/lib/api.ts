const API_URL =  "http://localhost:8000";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }
  })

  if (!response.ok) {
    let errorMessage = 'Something went wrong';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // If response is not JSON, use default error message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}