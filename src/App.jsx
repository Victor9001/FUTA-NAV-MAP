import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import MapView from './components/Map'
import About from './components/About'
import { LOCATIONS } from './data/locations'

export default function App() {
  const [query, setQuery] = useState('')

  return (
    <div className="min-h-screen bg-ink text-white">
      <Navbar />
      <Hero query={query} onQueryChange={setQuery} />
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <MapView locations={LOCATIONS} query={query} />
      </section>
      <About />
    </div>
  )
}