// Simulates network latency so the UI's loading states are exercised
// realistically, the same way real fetch() calls to FastAPI would behave.
export function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}
