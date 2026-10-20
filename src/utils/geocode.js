const cache = new Map()

// left, top, right, bottom (Akure area)
const VIEWBOX = '5.10,7.34,5.18,7.26'

export async function searchPlaces(query) {
  const q = query.trim()
  if (q.length < 3) return []
  const key = q.toLowerCase()
  if (cache.has(key)) return cache.get(key)

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '5')
  url.searchParams.set('countrycodes', 'ng')
  url.searchParams.set('viewbox', VIEWBOX)
  url.searchParams.set('bounded', '1')

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error('geocode ' + res.status)
    const data = await res.json()
    const results = data.map((r) => ({
      name: r.name || r.display_name.split(',')[0],
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      detail: r.display_name,
    }))
    cache.set(key, results)
    return results
  } finally {
    clearTimeout(timer)
  }
}