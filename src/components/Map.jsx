import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

maplibregl.setWorkerUrl(maplibreWorkerUrl)

const STREET_STYLE = 'https://tiles.openfreemap.org/styles/bright'
const SATELLITE_STYLE = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 17,
      attribution: 'Tiles &copy; Esri',
    },
  },
  layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }],
}
const CENTER = [5.1388, 7.3037]

export default function MapView({ locations }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [view, setView] = useState('street')

  useEffect(() => {
    const map = new maplibregl.Map({ container: containerRef.current, style: STREET_STYLE, center: CENTER, zoom: 16 })
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current = map
    locations.forEach((loc) => {
      const el = document.createElement('div')
      el.className = `h-4 w-4 rounded-full border-2 border-white shadow ${loc.verified ? 'bg-amber-400' : 'bg-slate-400'}`
      const popupHtml = `<div><div style="font-size:11px;color:#9b6cf0">${loc.category}</div><strong>${loc.name}</strong><div style="font-size:13px">${loc.desc}</div></div>`
      new maplibregl.Marker({ element: el }).setLngLat([loc.lng, loc.lat]).setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(popupHtml)).addTo(map)
    })
    return () => map.remove()
  }, [locations])

  function toggleView(next) {
    setView(next)
    mapRef.current.setStyle(next === 'satellite' ? SATELLITE_STYLE : STREET_STYLE)
  }

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-xl border border-white/10">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute left-3 top-3 z-10 flex overflow-hidden rounded-lg border border-white/10 bg-ink/90 text-xs">
        <button type="button" onClick={() => toggleView('street')} className={`px-3 py-1.5 ${view === 'street' ? 'bg-futa-400/20 text-futa-400' : 'text-white/60'}`}>Street</button>
        <button type="button" onClick={() => toggleView('satellite')} className={`px-3 py-1.5 ${view === 'satellite' ? 'bg-futa-400/20 text-futa-400' : 'text-white/60'}`}>Satellite</button>
      </div>
    </div>
  )
}