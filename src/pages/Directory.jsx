import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LOCATIONS } from '../data/locations'
import { slugify } from '../utils/slug'

export default function Directory() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const categories = ['All', ...new Set(LOCATIONS.map((l) => l.category))]

  const filtered = LOCATIONS.filter((loc) => {
    const q = query.trim().toLowerCase()
    const matchesQuery = !q || [loc.name, ...(loc.aliases || [])].join(' ').toLowerCase().includes(q)
    const matchesCategory = activeCategory === 'All' || loc.category === activeCategory
    return matchesQuery && matchesCategory
  })

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-medium">Directory</h1>
      <p className="mt-2 text-sm text-white/60">Every building on the map, in one browsable list.</p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name..."
        className="mt-6 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-futa-400"
      />

      <div className="mt-3 flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full border px-3 py-1 text-xs ${
              activeCategory === cat
                ? 'border-futa-400 bg-futa-400/20 text-futa-400'
                : 'border-white/10 text-white/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <ul className="mt-6 divide-y divide-white/10">
        {filtered.map((loc) => (
          <li key={loc.name} className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{loc.name}</p>
                <p className="mt-0.5 text-xs text-futa-400">{loc.category}</p>
                <p className="mt-1 text-sm text-white/60">{loc.desc}</p>
                {loc.aliases?.length > 0 && (
                  <p className="mt-1 text-xs text-white/40">Also known as: {loc.aliases.join(', ')}</p>
                )}
              </div>
              <Link
                to={`/?to=${slugify(loc.name)}`}
                className="shrink-0 rounded-lg bg-futa-400/20 px-3 py-1.5 text-xs text-futa-400"
              >
                View on map
              </Link>
            </div>
          </li>
        ))}
        {filtered.length === 0 && <li className="py-8 text-center text-sm text-white/40">No matches.</li>}
      </ul>
    </div>
  )
}