import { Search } from 'lucide-react'

export default function Hero({ query, onQueryChange, onSubmit }) {
  return (
    <section id="home" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-16 text-center sm:py-24">
      <h1 className="text-3xl font-medium sm:text-4xl">Find your way around FUTA</h1>
      <p className="mt-3 text-white/60">
        Search any building, hostel or office on campus and get there.
      </p>
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit() }}
        className="mx-auto mt-8 flex max-w-md items-center gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search a building..."
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-white/40 focus:border-futa-400"
        />
        <button
          type="submit"
          aria-label="Search"
          className="rounded-lg bg-futa-400/20 p-2.5 text-futa-400 transition hover:bg-futa-400/30"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>
    </section>
  )
}