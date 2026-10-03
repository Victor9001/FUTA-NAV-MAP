import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Hero from '../components/Hero'
import MapView from '../components/Map'
import About from '../components/About'
import { LOCATIONS } from '../data/locations'
import { slugify } from '../utils/slug'

export default function Home() {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [searchTrigger, setSearchTrigger] = useState(0)
  const [sharedLocation, setSharedLocation] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const to = params.get('to')
    const loc = params.get('loc')

    if (to) {
      const match = LOCATIONS.find((l) => slugify(l.name) === to)
      if (match) {
        setQuery(match.name)
        setSearchTrigger((n) => n + 1)
      }
      return
    }

    if (loc) {
      const [latStr, lngStr] = loc.split(',')
      const lat = parseFloat(latStr)
      const lng = parseFloat(lngStr)
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        setSharedLocation({ lat, lng })
      }
    }
  }, [])

  useEffect(() => {
    if (!location.hash) return
    const el = document.getElementById(location.hash.slice(1))
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }, [location.hash])


  return (
    <>
      <Hero query={query} onQueryChange={setQuery} onSubmit={() => setSearchTrigger((n) => n + 1)} />
      <section id="map" className="mx-auto max-w-5xl scroll-mt-20 px-6 pb-20">
        <MapView locations={LOCATIONS} query={query} searchTrigger={searchTrigger} sharedLocation={sharedLocation} />
      </section>
      <About />
    </>
  )
}