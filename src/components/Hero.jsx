import { Search } from 'lucide-react'

export default function Hero({ query, onQueryChange, onSubmit }) {
  return (
    <div id="home" className="px-3 pt-3 pb-2">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="mx-auto flex max-w-xl items-center gap-2">
        <input
          type="text"
          aria-label="Search for a building"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search a building..."
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-white/40 focus:border-futa-400"
        />
        <button
          type="submit"
          aria-label="Search"
          className="rounded-lg bg-futa-400/20 p-2 text-futa-400 transition hover:bg-futa-400/30"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}