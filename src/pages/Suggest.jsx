import { lazy, Suspense, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { withTimeout } from '../utils/withTimeout'
import { db } from "../firestore";
import { useAuth } from '../context/AuthContext'
import { LOCATIONS } from '../data/locations'

const MapPicker = lazy(() => import('../components/MapPicker'));
const FUTA_VIEWBOX = '5.125,7.315,5.150,7.295'

export default function Suggest() {
  const { currentUser } = useAuth()
  const existingCategories = [...new Set(LOCATIONS.map((l) => l.category))]

  const [name, setName] = useState('')
  const [category, setCategory] = useState(existingCategories[0] || '')
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [status, setStatus] = useState('idle')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeMsg, setGeocodeMsg] = useState('')
  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)
  const pin =
    Number.isFinite(latNum) && Number.isFinite(lngNum)
      ? { lat: latNum, lng: lngNum }
      : null

  async function findCoordinates() {
    if (!name.trim()) {
      setGeocodeMsg('Type the name first.')
      return
    }
    setGeocoding(true)
    setGeocodeMsg('')
    try {
      const query = encodeURIComponent(`${name}, Federal University of Technology Akure, Nigeria`)
      const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=ng&viewbox=${FUTA_VIEWBOX}&bounded=1`
      const res = await fetch(url)
      const results = await res.json()
      if (results.length > 0) {
        setLat(results[0].lat)
        setLng(results[0].lon)
        setGeocodeMsg('Found an approximate location” check it below and adjust if needed.')
      } else {
        setGeocodeMsg("Couldn't find it automatically. You can still submit without coordinates.")
      }
    } catch (err) {
      setGeocodeMsg("Couldn't search for a location right now.")
    } finally {
      setGeocoding(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('saving')
    try {
      await withTimeout(addDoc(collection(db, 'suggestions'), {
        name,
        category,
        description,
        lat: pin ? pin.lat : null,
        lng: pin ? pin.lng : null,
        submittedByUid: currentUser.uid,
        submittedByName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        status: 'pending',
      }))
      setStatus('done')
      setName('')
      setDescription('')
      setLat('')
      setLng('')
      setGeocodeMsg('')
    } catch (err) {
      console.error('FIRESTORE ERROR:', err)
      console.error('CODE:', err?.code)
      console.error('MESSAGE:', err?.message)
          setStatus(err.message === 'timeout' ? 'timeout' : 'error')
    }
  }

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-2xl font-medium">Suggest a location</h1>
        <p className="mt-3 text-sm text-white/60">Sign in first so we know who to credit for the suggestion.</p>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-2xl font-medium">Thanks!</h1>
        <p className="mt-3 text-sm text-white/60">Your suggestion has been submitted for review.</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-6 rounded-lg bg-futa-400/20 px-4 py-2 text-sm text-futa-400"
        >
          Suggest another
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-medium">Suggest a location</h1>
      <p className="mt-2 text-sm text-white/60">
        Know a building, hostel, or spot that's missing from the map? Let us know.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <input
          type="text"
          placeholder="Building / place name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-futa-400"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-futa-400"
        >
          {existingCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
          <option value="Other">Other</option>
        </select>
        <textarea
          placeholder="What is it / where is it roughly?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-futa-400"
        />

        <button
          type="button"
          onClick={findCoordinates}
          disabled={geocoding}
          className="self-start rounded-lg bg-futa-400/20 px-3 py-1.5 text-xs text-futa-400 disabled:opacity-60"
        >
          {geocoding ? 'Searching...' : 'Find coordinates automatically'}
        </button>
        {geocodeMsg && <p className="text-xs text-white/50">{geocodeMsg}</p>}

        <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-lg bg-white/5" />}>
          <MapPicker
            value={pin}
            onChange={(p) => {
              setLat(String(p.lat))
              setLng(String(p.lng))
            }}
          />
        </Suspense>
        {status === 'error' && <p className="text-xs text-red-400">Something went wrong” try again.</p>}
        {status === 'timeout' && <p className="text-xs text-red-400">No connection. It may still send when you're back online, so check before resubmitting.</p>}
        <button
          type="submit"
          disabled={status === 'saving'}
          className="rounded-lg bg-futa-400 py-2 text-sm font-medium text-ink disabled:opacity-60"
        >
          {status === 'saving' ? 'Submitting...' : 'Submit suggestion'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-white/60">
          Found a wrong pin or a bug?{' '}
  <a
    href="mailto:vicshelby804@gmail.com?subject=FUTA%20Nav%20issue"
    className="text-futa-400 underline"
       >
    Report an issue
  </a>
   </p>
    </div>
  )
}