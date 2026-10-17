export function withTimeout(promise, ms = 10000) {
  let id
  const timeout = new Promise((_, reject) => {
    id = setTimeout(() => reject(new Error('timeout')), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(id))
}