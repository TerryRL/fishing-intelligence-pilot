export function assertNoError<T extends { error: { message: string } | null }>(result: T): T {
  if (result.error) throw new Error(result.error.message)
  return result
}

export function nowIso(): string {
  return new Date().toISOString()
}
