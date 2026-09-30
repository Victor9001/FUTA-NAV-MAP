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

function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}

function buildPopup(loc, onDirections) {
  const el = document.createElement('div')
  const cat = document.createElement('div')
  cat.style.cssText = 'font-size:11px;color:#9b6cf0'
  cat.textContent = loc.category
  const title = document.createElement('strong')
  title.textContent = loc.name
  const desc = document.createElement('div')
  desc.style.fontSize = '13px'
  desc.textContent = loc.desc
  el.append(cat, title, desc)

  const btn = document.createElement('button')
  btn.textContent = 'Directions from my location'
  btn.style.cssText =
    'margin-top:8px;font-size:12px;color:#60a5fa;background:rgba(96,165,250,.15);border:none;padding:6px 10px;border-radius:6px;cursor:pointer'
  btn.addEventListener('click', async () => {
    btn.textContent = 'Loading...'
    try {
      await onDirections(loc)
      btn.textContent = 'Directions from my location'
    } catch (err) {
      btn.textContent = 'Location unavailable'
      setTimeout(() => { btn.textContent = 'Directions from my location' }, 2000)
    }
  })
  el.appendChild(btn)
  return el
}

export default function MapView({ locations, query }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)
  const routeDataRef = useRef({ type: 'FeatureCollection', features: [] })
  const [view, setView] = useState('street')

  useEffect(() => {
    const map = new maplibregl.Map({ container: containerRef.current, style: STREET_STYLE, center: CENTER, zoom: 16 })
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current = map

    map.on('style.load', () => {
      if (!map.getSource('route')) {
        map.addSource('route', { type: 'geojson', data: routeDataRef.current })
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#3b82f6', 'line-width': 4 },
        })
      }
    })

    async function showRoute(dest) {
      const userLoc = await getUserLocation()

      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat([userLoc.lng, userLoc.lat])
      } else {
        const el = document.createElement('div')
        el.className = 'h-4 w-4 rounded-full border-2 border-white shadow bg-blue-400'
        userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([userLoc.lng, userLoc.lat]).addTo(map)
      }

      const url = `https://router.project-osrm.org/route/v1/foot/${userLoc.lng},${userLoc.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`
      const res = await fetch(url)
      const data = await res.json()
      const route = data.routes && data.routes[0]
      if (!route) throw new Error('No route found')
      const geojson = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: route.geometry, properties: {} }] }
      routeDataRef.current = geojson
      const source = map.getSource('route')
      if (source) source.setData(geojson)
    }

    markersRef.current = locations.map((loc) => {
      const baseColor = loc.verified ? 'bg-amber-400' : 'bg-slate-400'
      const wrap = document.createElement('div')
      wrap.style.cssText = 'position:relative;width:16px;height:16px'

      const dot = document.createElement('div')
      dot.className = `h-4 w-4 rounded-full border-2 border-white shadow ${baseColor}`
      dot.style.cssText += ';position:absolute;left:0;top:0'

      const label = document.createElement('span')
      label.textContent = loc.name
      label.style.cssText =
        'position:absolute;left:20px;top:50%;transform:translateY(-50%);display:none;font-weight:700;color:#4ade80;font-size:12px;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,.9)'

      wrap.append(dot, label)

      const marker = new maplibregl.Marker({ element: wrap })
        .setLngLat([loc.lng, loc.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setDOMContent(buildPopup(loc, showRoute)))
        .addTo(map)
      const searchText = [loc.name, ...(loc.aliases || [])].join(' ').toLowerCase()
      return { marker, dot, label, baseColor, searchText }
    })

    return () => map.remove()
  }, [locations])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    let firstMatch = null
    markersRef.current.forEach(({ marker, dot, label, baseColor, searchText }) => {
      const isMatch = q.length > 0 && searchText.includes(q)
      dot.className = `h-4 w-4 rounded-full border-2 border-white shadow ${isMatch ? 'bg-green-400' : baseColor}`
      label.style.display = isMatch ? 'block' : 'none'
      if (isMatch && !firstMatch) firstMatch = marker
    })
    if (firstMatch && mapRef.current) {
      mapRef.current.flyTo({ center: firstMatch.getLngLat(), zoom: 17 })
    }
  }, [query])

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