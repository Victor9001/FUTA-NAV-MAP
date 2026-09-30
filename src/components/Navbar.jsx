import { Compass } from 'lucide-react'

const links = [
         { label: 'Home', href: '#home' },
         { label: 'Map', href: '#map' },
         { label: 'About', href: '#about' },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-ink/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-futa-400" />
          <span className="font-medium font-sans">FUTA Nav</span>
        </div>
        <ul className="flex gap-6 text-sm text-white/70">
          {links.map((link) => (
            <li key={link.label} className="cursor-pointer transition hover:text-white">
              <a href={link.href} className="transition hover:text-white">
                     {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}