import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

maplibregl.setWorkerUrl(workerUrl)

const CENTER = [5.1388, 7.3037] // [lng, lat]

function round(n) {
  return Math.round(n * 1e6) / 1e6
}

export default function MapPicker({ value, onChange }) {
  const box = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const [msg, setMsg] = useState('')

  onChangeRef.current = onChange

  function place(lng, lat, fly) {
    const map = mapRef.current
    if (!map) return
    if (!markerRef.current) {
      const m = new maplibregl.Marker({ color: '#9b6cf0', draggable: true })
        .setLngLat([lng, lat])
        .addTo(map)
      m.on('dragend', () => {
        const p = m.getLngLat()
        onChangeRef.current({ lat: round(p.lat), lng: round(p.lng) })
      })
      markerRef.current = m
    } else {
      markerRef.current.setLngLat([lng, lat])
    }
    if (fly) map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 18) })
    onChangeRef.current({ lat: round(lat), lng: round(lng) })
  }

  useEffect(() => {
    const map = new maplibregl.Map({
      container: box.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: value ? [value.lng, value.lat] : CENTER,
      zoom: value ? 18 : 15,
    })
    mapRef.current = map
    map.on('click', (e) => place(e.lngLat.lng, e.lngLat.lat, false))
    if (value) place(value.lng, value.lat, false)
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function useMyLocation() {
    if (!navigator.geolocation) {
      setMsg('Location is not available on this device.')
      return
    }
    setMsg('Finding you...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMsg('')
        place(pos.coords.longitude, pos.coords.latitude, true)
      },
      () => setMsg('Could not get your location. Tap the map instead.'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div>
      <div ref={box} className="h-64 w-full overflow-hidden rounded-lg border border-white/10" />
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <button
          type="button"
          onClick={useMyLocation}
          className="rounded border border-futa-400/50 px-3 py-1 text-futa-400"
        >
          I am at this place now
        </button>
        <span className="text-white/60">
          {value ? 'Pin set. Drag it to adjust.' : 'Tap the map to drop a pin.'}
        </span>
      </div>
      {msg && <p role="status" className="mt-1 text-xs text-amber-300">{msg}</p>}
    </div>
  )
}