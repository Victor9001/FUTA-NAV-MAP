import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Hero from '../components/Hero'
import MapView from '../components/Map'
import { LOCATIONS } from '../data/locations'
import { slugify } from '../utils/slug'

export default function Home() {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [searchTrigger, setSearchTrigger] = useState(0)
  const [sharedLocation, setSharedLocation] = useState(null)
  const [shareStatus, setShareStatus] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const to = params.get('to')
    const share = params.get('share')

    if (to) {
      const match = LOCATIONS.find((l) => slugify(l.name) === to)
      if (match) {
        setQuery(match.name)
        setSearchTrigger((n) => n + 1)
      }
      return
    }

    if (share) {
      getDoc(doc(db, 'shares', share))
        .then((snap) => {
          if (!snap.exists()) {
            setShareStatus('not-found')
            return
          }
          const data = snap.data()
          const createdMs = data.createdAt?.toMillis?.() ?? 0
          const ageMinutes = (Date.now() - createdMs) / 60000
          if (ageMinutes > 30) {
            setShareStatus('expired')
            return
          }
          setSharedLocation({ lat: data.lat, lng: data.lng })
        })
        .catch(() => setShareStatus('not-found'))
    }
  }, [])

  useEffect(() => {
    if (!location.hash) return
    const el = document.getElementById(location.hash.slice(1))
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }, [location.hash])

  return (
    <div className="flex h-full flex-col">
      <Hero query={query} onQueryChange={setQuery} onSubmit={() => setSearchTrigger((n) => n + 1)} />
      {shareStatus === 'expired' && (
        <p className="px-3 pb-1 text-center text-xs text-amber-400">This shared location link has expired.</p>
      )}
      {shareStatus === 'not-found' && (
        <p className="px-3 pb-1 text-center text-xs text-amber-400">This shared location link is invalid.</p>
      )}
      <section id="map" className="min-h-0 flex-1 px-3 pb-3">
        <MapView locations={LOCATIONS} query={query} searchTrigger={searchTrigger} sharedLocation={sharedLocation} />
      </section>
    </div>
  )
}