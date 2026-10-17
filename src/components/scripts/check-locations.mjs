import { LOCATIONS } from '../src/data/locations.js'

const BOUNDS = { latMin: 7.28, latMax: 7.33, lngMin: 5.12, lngMax: 5.16 }
const REQUIRED = ['name', 'lat', 'lng', 'category', 'verified', 'aliases', 'desc']
const problems = []
const names = new Map()
const coords = new Map()

LOCATIONS.forEach((l, i) => {
  const tag = `#${i} ${l.name ?? '(no name)'}`
  for (const k of REQUIRED) if (l[k] === undefined) problems.push(`${tag}: missing ${k}`)
  if (typeof l.lat !== 'number' || typeof l.lng !== 'number') {
    problems.push(`${tag}: lat/lng not numbers`)
  } else if (
    l.lat < BOUNDS.latMin || l.lat > BOUNDS.latMax ||
    l.lng < BOUNDS.lngMin || l.lng > BOUNDS.lngMax
  ) {
    problems.push(`${tag}: coords outside FUTA area (${l.lat}, ${l.lng}). lat/lng swapped?`)
  }
  const n = (l.name || '').trim().toLowerCase()
  if (names.has(n)) problems.push(`${tag}: duplicate name of #${names.get(n)}`)
  names.set(n, i)
  const c = `${l.lat},${l.lng}`
  if (coords.has(c)) problems.push(`${tag}: same coords as #${coords.get(c)}`)
  coords.set(c, i)
  if (l.aliases && !Array.isArray(l.aliases)) problems.push(`${tag}: aliases must be an array`)
})

const verified = LOCATIONS.filter((l) => l.verified).length
const cats = {}
LOCATIONS.forEach((l) => (cats[l.category] = (cats[l.category] || 0) + 1))

console.log(`Total: ${LOCATIONS.length} | Verified: ${verified} | Placeholder: ${LOCATIONS.length - verified}`)
console.log('By category:', cats)
console.log(problems.length ? `\n${problems.length} problem(s):\n` + problems.join('\n') : '\nNo problems found.')