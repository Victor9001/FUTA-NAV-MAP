import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  getDocs,
  orderBy,
  query,
  updateDoc,
  doc,
} from 'firebase/firestore'
import { db } from '../firestore'
import { useAuth } from '../context/AuthContext'
import { LOCATIONS } from '../data/locations'

const CENTER = { lat: 7.3037, lng: 5.1388 }
const MAX_KM = 3
const DUP_M = 25

function distanceM(aLat, aLng, bLat, bLng) {
  const R = 6371000
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(bLat - aLat)
  const dLng = rad(bLng - aLng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function fmt(m) {
  return m < 1000 ? Math.round(m) + ' m' : (m / 1000).toFixed(1) + ' km'
}

function checkSuggestion(s) {
  const lat = Number(s.lat)
  const lng = Number(s.lng)
  if (s.lat == null || s.lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { usable: false, flags: [{ bad: true, text: 'No usable coordinates' }] }
  }

  const flags = []

  const fromCenter = distanceM(CENTER.lat, CENTER.lng, lat, lng)
  if (fromCenter > MAX_KM * 1000) {
    flags.push({
      bad: true,
      text: fmt(fromCenter) + ' from campus center. Swapped lat/lng or typo?',
    })
  }

  let nearest = null
  for (const loc of LOCATIONS) {
    const d = distanceM(lat, lng, loc.lat, loc.lng)
    if (!nearest || d < nearest.d) nearest = { name: loc.name, d }
  }
  if (nearest) {
    flags.push({
      bad: nearest.d < DUP_M,
      text:
        nearest.d < DUP_M
          ? 'Only ' + fmt(nearest.d) + ' from "' + nearest.name + '". Likely duplicate.'
          : 'Nearest existing pin: ' + nearest.name + ', ' + fmt(nearest.d),
    })
  }

  const sameName = LOCATIONS.some(
    (loc) => loc.name.trim().toLowerCase() === String(s.name || '').trim().toLowerCase()
  )
  if (sameName) flags.push({ bad: true, text: 'Name already exists in locations.js' })

  const satUrl =
    'https://www.google.com/maps/@?api=1&map_action=map&center=' +
    lat + ',' + lng + '&zoom=19&basemap=satellite'

  return { usable: true, flags, satUrl }
}

function toEntry(s) {
  return (
    '  { name: ' + JSON.stringify(s.name) + ',\n' +
    '    lat: ' + s.lat + ',\n' +
    '    lng: ' + s.lng + ',\n' +
    '    category: ' + JSON.stringify(s.category) + ',\n' +
    '    verified: false,\n' +
    '    aliases: [],\n' +
    '    desc: ' + JSON.stringify(s.description || '') + ' },\n'
  )
}

export default function Admin() {
  const { currentUser } = useAuth()
  const [items, setItems] = useState([])
  const [state, setState] = useState('loading')
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    if (!currentUser) {
      setState('signin')
      return
    }
    getDocs(query(collection(db, 'suggestions'), orderBy('createdAt', 'desc')))
      .then((snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setState('ready')
      })
      .catch((err) => {
        console.error('Admin load failed:', err)
        setState(err.code === 'permission-denied' ? 'denied' : 'error')
      })
  }, [currentUser])

  const checks = useMemo(() => {
    const out = {}
    for (const s of items) out[s.id] = checkSuggestion(s)
    return out
  }, [items])

  async function setStatus(id, status) {
    try {
      await updateDoc(doc(db, 'suggestions', id), { status })
      setItems((list) => list.map((i) => (i.id === id ? { ...i, status } : i)))
    } catch (err) {
      console.error('Update failed:', err)
    }
  }

  async function copyEntry(s) {
    try {
      await navigator.clipboard.writeText(toEntry(s))
      setCopied(s.id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      console.error('Clipboard blocked')
    }
  }

  const msg = {
    loading: 'Loading...',
    signin: 'Sign in first.',
    denied: 'Not authorized.',
    error: 'Could not load suggestions.',
  }[state]

  if (msg) return <p className="px-6 py-10 text-center text-white/70">{msg}</p>

  return (
    <div className="mx-auto max-w-2xl overflow-y-auto px-4 py-6 pb-24">
      <h1 className="mb-4 text-xl font-medium">
        Suggestions ({items.filter((i) => i.status === 'pending').length} pending)
      </h1>
      {items.length === 0 && <p className="text-white/60">None yet.</p>}
      <ul className="flex flex-col gap-3">
        {items.map((s) => {
          const c = checks[s.id]
          return (
            <li key={s.id} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{s.name}</p>
                <span className="text-xs text-white/50">{s.status}</span>
              </div>
              <p className="text-white/60">{s.category}</p>
              {s.description && <p className="mt-1 text-white/80">{s.description}</p>}
              <p className="mt-1 text-xs text-white/50">
                {c.usable ? s.lat + ', ' + s.lng : 'no coordinates'} | by {s.submittedByName}
              </p>

              <ul className="mt-2 flex flex-col gap-0.5 text-xs">
                {c.flags.map((f, i) => (
                  <li key={i} className={f.bad ? 'text-red-300' : 'text-white/60'}>
                    {f.bad ? 'Check: ' : ''}{f.text}
                  </li>
                ))}
              </ul>

              <div className="mt-2 flex flex-wrap gap-2">
                 {!c.usable && (
                  <a
                    href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.name + ' FUTA Akure')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded border border-futa-400/50 px-3 py-1 text-xs text-futa-400"
                  >
                    Find on Google Maps
                  </a>
                )}
                {c.usable && (
                  <a
                    href={c.satUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded border border-futa-400/50 px-3 py-1 text-xs text-futa-400"
                  >
                    View satellite
                  </a>
                )}
                {c.usable && (
                  <button
                    onClick={() => copyEntry(s)}
                    className="rounded bg-futa-400 px-3 py-1 text-xs font-medium text-ink"
                  >
                    {copied === s.id ? 'Copied!' : 'Copy locations.js entry'}
                  </button>
                )}
                <button
                  onClick={() => setStatus(s.id, 'approved')}
                  className="rounded border border-white/20 px-3 py-1 text-xs"
                >
                  Mark approved
                </button>
                <button
                  onClick={() => setStatus(s.id, 'rejected')}
                  className="rounded border border-white/20 px-3 py-1 text-xs"
                >
                  Reject
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}