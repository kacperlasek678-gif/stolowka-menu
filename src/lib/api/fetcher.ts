export async function apiFetch<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      json.error ?? "Wystąpił nieznany błąd."
    );
  }

  return json;
}