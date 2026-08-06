type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

/**
 * Ограничение частоты в памяти процесса.
 *
 * Ограничение, о котором нужно помнить: при нескольких репликах приложения
 * лимит считается по каждой реплике отдельно. Для горизонтального
 * масштабирования нужен общий Redis — см. docs/deployment.md.
 */
export const checkRateLimit = (
  key: string,
  { limit = 5, windowMs = 10 * 60 * 1000 } = {},
): { allowed: boolean; retryAfterSeconds: number } => {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    pruneExpired(now)
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}

const pruneExpired = (now: number) => {
  if (buckets.size < 500) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

/** Только для тестов: сбрасывает состояние между кейсами. */
export const resetRateLimit = () => buckets.clear()
