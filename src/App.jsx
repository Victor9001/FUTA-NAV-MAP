import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import MapView from './components/Map'
import About from './components/About'
import { LOCATIONS } from './data/locations'
import { slugify } from './utils/slug'

export default function App() {
  const [query, setQuery] = useState('')
  const [searchTrigger, setSearchTrigger] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const to = params.get('to')
    if (!to) return
    const match = LOCATIONS.find((loc) => slugify(loc.name) === to)
    if (match) {
      setQuery(match.name)
      setSearchTrigger((n) => n + 1)
    }
  }, [])

  return (
    <div className="min-h-screen bg-ink text-white">
      <Navbar />
      <Hero query={query} onQueryChange={setQuery} onSubmit={() => setSearchTrigger((n) => n + 1)} />
      <section id="map" className="mx-auto max-w-5xl scroll-mt-20 px-6 pb-20">
        <MapView locations={LOCATIONS} query={query} searchTrigger={searchTrigger} />
      </section>
      <About />
    </div>
  )
}