import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-10 border-t border-white/10 px-4 py-6 text-sm text-white/60">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <p>FUTA Nav - campus map and walking directions, made for FUTA students.</p>
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/" className="hover:text-futa-400">Map</Link>
          <Link to="/directory" className="hover:text-futa-400">Directory</Link>
          <Link to="/suggest" className="hover:text-futa-400">Suggest a place</Link>
          <a
            href="mailto:vicshelby804@gmail.com?subject=FUTA%20Nav%20issue"
            className="hover:text-futa-400"
          >
            Report an issue
          </a>
        </nav>
      </div>
      <p className="mt-4 text-center text-xs text-white/40">
        {'\u00A9'} {year} FUTA Nav
      </p>
    </footer>
  )
}