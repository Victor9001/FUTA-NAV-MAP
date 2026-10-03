import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import lineSlice from '@turf/line-slice'
import { point, lineString } from '@turf/helpers'
import { slugify } from '../utils/slug'

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
const LABEL_MIN_ZOOM = 16

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

  const row = document.createElement('div')
  row.style.cssText = 'margin-top:8px;display:flex;gap:6px'

  const btn = document.createElement('button')
  btn.textContent = 'Directions from my location'
  btn.style.cssText =
    'font-size:12px;color:#60a5fa;background:rgba(96,165,250,.15);border:none;padding:6px 10px;border-radius:6px;cursor:pointer'
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

  const shareBtn = document.createElement('button')
  shareBtn.textContent = 'Share'
  shareBtn.style.cssText =
    'font-size:12px;color:#9b6cf0;background:rgba(155,108,240,.15);border:none;padding:6px 10px;border-radius:6px;cursor:pointer'
  shareBtn.addEventListener('click', async () => {
    const url = `${window.location.origin}${window.location.pathname}?to=${slugify(loc.name)}`
    try {
      await navigator.clipboard.writeText(url)
      shareBtn.textContent = 'Copied!'
    } catch (err) {
      shareBtn.textContent = 'Copy failed'
    }
    setTimeout(() => { shareBtn.textContent = 'Share' }, 2000)
  })

  row.append(btn, shareBtn)
  el.appendChild(row)
  return el
}

function updateMarkerAppearance(map, markers, query, activeCategory) {
  const q = query.trim().toLowerCase()
  const zoomedIn = map.getZoom() >= LABEL_MIN_ZOOM
  let firstMatch = null

  markers.forEach(({ marker, dot, label, baseColor, searchText, category }) => {
    const categoryOk = activeCategory === 'All' || category === activeCategory
    marker.getElement().style.display = categoryOk ? '' : 'none'
    if (!categoryOk) return

    const isMatch = q.length > 0 && searchText.includes(q)
    dot.className = `h-4 w-4 rounded-full border-2 border-white shadow ${isMatch ? 'bg-green-400' : baseColor}`

    if (isMatch) {
      label.style.cssText =
        'position:absolute;left:20px;top:50%;transform:translateY(-50%);display:block;font-weight:700;font-size:13px;color:#0f172a;background:#4ade80;padding:3px 9px;border-radius:6px;white-space:nowrap;box-shadow:0 1px 6px rgba(74,222,128,.5)'
    } else if (zoomedIn) {
      label.style.cssText =
        'position:absolute;left:20px;top:50%;transform:translateY(-50%);display:block;font-weight:600;font-size:12px;color:#ffffff;background:rgba(15,10,30,.85);padding:2px 8px;border-radius:6px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.4)'
    } else {
      label.style.display = 'none'
    }

    if (isMatch && !firstMatch) firstMatch = marker
  })

  return firstMatch
}

export default function MapView({ locations, query, searchTrigger, sharedLocation }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)
  const userLocationRef = useRef(null)
  const routeDataRef = useRef({ type: 'FeatureCollection', features: [] })
  const showRouteRef = useRef(null)
  const watchIdRef = useRef(null)
  const fullRouteRef = useRef(null)
  const destPointRef = useRef(null)
  const [view, setView] = useState('street')
  const [loading, setLoading] = useState(true)
  const [routeError, setRouteError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const activeCategoryRef = useRef('All')
  const sharedMarkerRef = useRef(null)
  const [shareLabel, setShareLabel] = useState('Share my location')

  useEffect(() => {
    const map = new maplibregl.Map({ container: containerRef.current, style: STREET_STYLE, center: CENTER, zoom: 16 })
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current = map
    map.on('load', () => setLoading(false))

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

    // Start tracking the visitor's location as soon as the map loads — shows a
    // persistent purple "you are here" dot, independent of searching/directions.
    let gotFirstFix = false
    let settleFirstFix
    const firstFixPromise = new Promise((resolve, reject) => { settleFirstFix = { resolve, reject } })

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          userLocationRef.current = loc

          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([loc.lng, loc.lat])
          } else {
            const el = document.createElement('div')
            el.className = 'h-4 w-4 rounded-full border-2 border-white shadow bg-futa-400'
            userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([loc.lng, loc.lat]).addTo(map)
          }

          if (fullRouteRef.current && destPointRef.current) {
            try {
              const line = lineString(fullRouteRef.current)
              const sliced = lineSlice(point([loc.lng, loc.lat]), destPointRef.current, line)
              const geojson = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: sliced.geometry, properties: {} }] }
              routeDataRef.current = geojson
              const source = map.getSource('route')
              if (source) source.setData(geojson)
            } catch (err) {
              console.error('Route trim failed:', err)
            }
          }

          if (!gotFirstFix) {
            gotFirstFix = true
            map.flyTo({ center: [loc.lng, loc.lat], zoom: 17 })
            settleFirstFix.resolve(loc)
          }
        },
        (err) => {
          console.error('Geolocation failed:', err)
          if (!gotFirstFix) {
            gotFirstFix = true
            settleFirstFix.reject(err)
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
      watchIdRef.current = watchId
    } else {
      settleFirstFix.reject(new Error('Geolocation not supported'))
    }

    async function showRoute(dest) {
      const userLoc = userLocationRef.current || (await firstFixPromise)

      const url = `https://router.project-osrm.org/route/v1/foot/${userLoc.lng},${userLoc.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`
      const res = await fetch(url)
      const data = await res.json()
      const route = data.routes && data.routes[0]
      if (!route) throw new Error('No route found')
      fullRouteRef.current = route.geometry.coordinates
      destPointRef.current = point([dest.lng, dest.lat])

      const geojson = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: route.geometry, properties: {} }] }
      routeDataRef.current = geojson
      const source = map.getSource('route')
      if (source) source.setData(geojson)
    }

    showRouteRef.current = showRoute

    markersRef.current = locations.map((loc) => {
      const baseColor = loc.verified ? 'bg-amber-400' : 'bg-slate-400'
      const wrap = document.createElement('div')
      wrap.style.cssText = 'width:16px;height:16px'

      const dot = document.createElement('div')
      dot.className = `h-4 w-4 rounded-full border-2 border-white shadow ${baseColor}`
      dot.style.cssText += ';position:absolute;left:0;top:0'

      const label = document.createElement('span')
      label.textContent = loc.name
      label.style.display = 'none'

      wrap.append(dot, label)

      const marker = new maplibregl.Marker({ element: wrap })
        .setLngLat([loc.lng, loc.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setDOMContent(buildPopup(loc, showRoute)))
        .addTo(map)
      const searchText = [loc.name, ...(loc.aliases || [])].join(' ').toLowerCase()
      return { marker, dot, label, baseColor, searchText, category: loc.category }
    })

    updateMarkerAppearance(map, markersRef.current, '', activeCategoryRef.current)
    map.on('zoomend', () => updateMarkerAppearance(map, markersRef.current, '', activeCategoryRef.current))

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      map.remove()
    }
  }, [locations])

  useEffect(() => {
    activeCategoryRef.current = activeCategory
    if (!mapRef.current) return
    const match = updateMarkerAppearance(mapRef.current, markersRef.current, query, activeCategory)
    if (match) mapRef.current.flyTo({ center: match.getLngLat(), zoom: 17 })
  }, [query, activeCategory])

  useEffect(() => {
    if (!sharedLocation || !mapRef.current || !showRouteRef.current) return

    const el = document.createElement('div')
    el.className = 'h-4 w-4 rounded-full border-2 border-white shadow bg-pink-400'
    if (sharedMarkerRef.current) sharedMarkerRef.current.remove()
    sharedMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([sharedLocation.lng, sharedLocation.lat])
      .setPopup(new maplibregl.Popup({ offset: 12 }).setText('Shared location'))
      .addTo(mapRef.current)

    mapRef.current.flyTo({ center: [sharedLocation.lng, sharedLocation.lat], zoom: 17 })

    setRouteError(null)
    showRouteRef.current({ lat: sharedLocation.lat, lng: sharedLocation.lng, name: 'Shared location' }).catch((err) => {
      console.error('Directions request failed:', err)
      setRouteError('Could not get a walking route to the shared location.')
      setTimeout(() => setRouteError(null), 6000)
    })
  }, [sharedLocation])

  function shareMyLocation() {
    const loc = userLocationRef.current
    if (!loc) {
      setShareLabel('Location not ready yet')
      setTimeout(() => setShareLabel('Share my location'), 2000)
      return
    }
    const url = `${window.location.origin}${window.location.pathname}?loc=${loc.lat},${loc.lng}`
    navigator.clipboard.writeText(url)
      .then(() => setShareLabel('Copied!'))
      .catch(() => setShareLabel('Copy failed'))
    setTimeout(() => setShareLabel('Share my location'), 2000)
  }

  useEffect(() => {
    if (searchTrigger === 0) return
    const q = query.trim().toLowerCase()
    if (!q) return
    const dest = locations.find((loc) => [loc.name, ...(loc.aliases || [])].join(' ').toLowerCase().includes(q))
    if (dest && showRouteRef.current) {
      setRouteError(null)
      showRouteRef.current(dest).catch((err) => {
        console.error('Directions request failed:', err)
        setRouteError('Could not get a walking route from your current location to this building.')
        setTimeout(() => setRouteError(null), 6000)
      })
    }
  }, [searchTrigger])

    const allCategories = [...new Set(locations.map((l) => l.category))]
    const visibleCategories = ['All', ...allCategories.slice(0, 3)]
    const overflowCategories = allCategories.slice(3)


  function toggleView(next) {
    setView(next)
    mapRef.current.setStyle(next === 'satellite' ? SATELLITE_STYLE : STREET_STYLE)
  }

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-xl border border-white/10">
      <div ref={containerRef} className="h-full w-full" />
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-ink/90">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-futa-400" />
          <span className="text-xs text-white/50">Loading map…</span>
        </div>
      )}
      {routeError && (
        <div className="absolute bottom-3 left-3 right-3 z-20 rounded-lg border border-red-400/30 bg-red-950/90 px-3 py-2 text-xs text-red-200">
          {routeError}
        </div>
      )}
      <div className="absolute left-3 top-3 z-10 flex overflow-hidden rounded-lg border border-white/10 bg-ink/90 text-xs">
        <button type="button" onClick={() => toggleView('street')} className={`px-3 py-1.5 ${view === 'street' ? 'bg-futa-400/20 text-futa-400' : 'text-white/60'}`}>Street</button>
        <button type="button" onClick={() => toggleView('satellite')} className={`px-3 py-1.5 ${view === 'satellite' ? 'bg-futa-400/20 text-futa-400' : 'text-white/60'}`}>Satellite</button>
      </div>
      <button
        type="button"
        onClick={shareMyLocation}
        className="absolute left-3 top-14 z-10 rounded-lg border border-white/10 bg-ink/90 px-3 py-1.5 text-xs text-futa-400"
      >
        {shareLabel}
      </button>
            <div className="absolute right-3 top-3 z-10 flex flex-wrap items-center justify-end gap-1.5 max-w-[65%]">
        {visibleCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full border px-2.5 py-1 text-[11px] ${
              activeCategory === cat
                ? 'border-futa-400 bg-futa-400/20 text-futa-400'
                : 'border-white/10 bg-ink/90 text-white/60'
            }`}
          >
            {cat}
          </button>
        ))}
        {overflowCategories.length > 0 && (
          <select
            value={overflowCategories.includes(activeCategory) ? activeCategory : ''}
            onChange={(e) => { if (e.target.value) setActiveCategory(e.target.value) }}
            className={`rounded-full border px-2 py-1 text-[11px] ${
              overflowCategories.includes(activeCategory)
                ? 'border-futa-400 bg-futa-400/20 text-futa-400'
                : 'border-white/10 bg-ink/90 text-white/60'
            }`}
          >
            <option value="">More</option>
            {overflowCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}