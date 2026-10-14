import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import lineSlice from '@turf/line-slice'
import { point, lineString } from '@turf/helpers'
import { slugify } from '../utils/slug'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

maplibregl.setWorkerUrl(maplibreWorkerUrl)

const STREET_STYLE = 'https://tiles.openfreemap.org/styles/bright'

const SATELLITE_STYLE = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 17,
      attribution: 'Tiles &copy; Esri',
    },
  },
  layers: [
    {
      id: 'satellite',
      type: 'raster',
      source: 'satellite',
    },
  ],
}

const CENTER = [5.1388, 7.3037]
const LABEL_MIN_ZOOM = 16
const EMPTY_ROUTE = { type: 'FeatureCollection', features: [] }

// Each row: [words to look for in the category name, emoji to show].
// The first row that matches wins, so more specific words go first.
// Change or add rows to match your own category names.
const CATEGORY_EMOJIS = [
  [['hostel', 'residence', 'accommodation', 'lodge'], '🏠'],
  [['hotel'], '🏨'],
  [['lecture', 'classroom', 'theatre', 'theater'], '🏫'],
  [['faculty', 'department', 'school', 'college'], '🏛️'],
  [['library'], '📚'],
  [['food', 'restaurant', 'cafe', 'canteen', 'cafeteria', 'eatery', 'buka'], '🍽️'],
  [['atm'], '🏧'],
  [['bank'], '🏦'],
  [['hospital', 'clinic', 'health', 'medical', 'pharmacy'], '🏥'],
  [['mosque'], '🕌'],
  [['church', 'chapel', 'worship'], '⛪'],
  [['sport', 'stadium', 'field', 'gym', 'pitch'], '⚽'],
  [['gate', 'entrance'], '🚪'],
  [['parking', 'bus', 'transport'], '🚌'],
  [['park', 'garden'], '🌳'],
  [['admin', 'office', 'senate', 'registry', 'bursary'], '🏢'],
  [['lab', 'workshop'], '🔬'],
  [['shop', 'market', 'store', 'mall'], '🛒'],
  [['security', 'police'], '👮'],
  [['toilet', 'restroom'], '🚻'],
  [['water', 'borehole'], '💧'],
  [['print', 'cyber', 'business center', 'business centre'], '🖨️'],
  [['fuel', 'filling'], '⛽'],
]

// Emoji and colour for each of your categories. Checked first.
// A category matches if its name STARTS with the key, so
// "Educational" matches "education" and "Laboratory" matches "lab".
const CATEGORY_STYLES = {
  landmark: { emoji: '⭐', color: '#f59e0b' },
  admin: { emoji: '🏢', color: '#6366f1' },
  education: { emoji: '🎓', color: '#3b82f6' },
  commercial: { emoji: '🛒', color: '#ec4899' },
  event: { emoji: '🎉', color: '#f97316' },
  hostel: { emoji: '🏠', color: '#10b981' },
  agricultural: { emoji: '🌾', color: '#84cc16' },
  religious: { emoji: '🙏', color: '#a855f7' },
  lab: { emoji: '🔬', color: '#06b6d4' },
  health: { emoji: '🏥', color: '#ef4444' },
  food: { emoji: '🍽️', color: '#eab308' },
  sport: { emoji: '⚽', color: '#14b8a6' },
  faculty: { emoji: '🏛️', color: '#8b5cf6' },
}

const DEFAULT_COLOR = '#94a3b8'

function styleFor(category) {
  const c = (category || '').trim().toLowerCase()

  const key = Object.keys(CATEGORY_STYLES).find((k) => c.startsWith(k))
  if (key) return CATEGORY_STYLES[key]

  // Not one of the categories above: fall back to keyword matching.
  for (const [words, emoji] of CATEGORY_EMOJIS) {
    if (words.some((w) => c.includes(w))) {
      return { emoji, color: DEFAULT_COLOR }
    }
  }

  return { emoji: '📍', color: DEFAULT_COLOR }
}

function buildPopup(loc, onDirections) {
  const el = document.createElement('div')

  const style = styleFor(loc.category)

  const cat = document.createElement('div')
  cat.style.cssText =
    'display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;' +
    'border-radius:999px;margin-bottom:4px;color:' + style.color +
    ';background:' + style.color + '22'
  cat.textContent =
    `${style.emoji} ${loc.category}` + (loc.verified ? ' ✓ Verified' : '')

  const title = document.createElement('strong')
  title.style.cssText = 'display:block;font-size:14px;color:#0f172a'
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
    btn.disabled = true

    try {
      await onDirections(loc)
      btn.textContent = 'Directions from my location'
    } catch (err) {
      btn.textContent = 'Location unavailable'
      setTimeout(() => {
        btn.textContent = 'Directions from my location'
      }, 2000)
    } finally {
      btn.disabled = false
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

    setTimeout(() => {
      shareBtn.textContent = 'Share'
    }, 2000)
  })

  row.append(btn, shareBtn)
  el.appendChild(row)

  return el
}

// Rough width of a label in pixels. Estimating is much faster than
// measuring the page, and it is accurate enough to spot overlaps.
function labelWidth(text, strong) {
  return Math.min(180, text.length * (strong ? 7.4 : 6.6) + 20)
}

function rectsOverlap(a, b) {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1
}

function hideLabel(m) {
  m.label.style.display = 'none'
}

// kind: 'match' (green), 'hover' (dark) or 'normal' (white).
function showLabel(m, side, kind) {
  const looks = {
    match:
      'font-weight:700;font-size:13px;color:#ffffff;background:#16a34a;' +
      'padding:3px 10px;box-shadow:0 2px 8px rgba(22,163,74,.55)',
    hover:
      'font-weight:700;font-size:13px;color:#ffffff;background:#1e293b;' +
      'padding:3px 10px;box-shadow:0 2px 8px rgba(0,0,0,.45)',
    normal:
      'font-weight:600;font-size:12px;color:#1e293b;' +
      'background:rgba(255,255,255,.95);padding:2px 9px;' +
      'box-shadow:0 1px 4px rgba(0,0,0,.3)',
  }

  m.label.style.cssText =
    'position:absolute;top:50%;transform:translateY(-50%);display:block;' +
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' +
    'max-width:180px;border-radius:999px;pointer-events:none;' +
    (side === 'right' ? 'left:34px;' : 'right:34px;') +
    looks[kind]
}

function updateMarkerAppearance(map, markers, query, activeCategory) {
  const q = query.trim().toLowerCase()
  const zoomedIn = map.getZoom() >= LABEL_MIN_ZOOM
  const canvas = map.getCanvas()
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  let firstMatch = null

  // 1. Apply the category filter and the search highlight to each badge.
  const visible = []

  markers.forEach((m) => {
    const categoryOk =
      activeCategory === 'All' || m.category === activeCategory

    m.marker.getElement().style.display = categoryOk ? '' : 'none'

    if (!categoryOk) return

    m.isMatch = q.length > 0 && m.searchText.includes(q)

    // A search match turns the badge green.
    m.dot.style.background = m.isMatch ? '#bbf7d0' : '#ffffff'
    m.dot.style.borderColor = m.isMatch ? '#22c55e' : m.ringColor

    // Matched or hovered markers sit on top of the others.
    m.marker.getElement().style.zIndex =
      m.isMatch || m.state.hover ? '5' : ''

    if (m.isMatch && !firstMatch) firstMatch = m.marker

    visible.push(m)
  })

  // 2. Work out where every badge is on the screen. Badges are obstacles
  //    that labels are not allowed to cover.
  const placed = []
  const points = new Map()

  visible.forEach((m) => {
    const p = map.project(m.marker.getLngLat())
    points.set(m, p)
    placed.push({ x1: p.x - 15, y1: p.y - 15, x2: p.x + 15, y2: p.y + 15 })
  })

  // 3. Place labels one by one, most important first:
  //    matches and hovered, then verified places, then the rest.
  const rank = (m) =>
    (m.isMatch || m.state.hover ? 2 : 0) + (m.verified ? 1 : 0)

  const order = [...visible].sort((a, b) => rank(b) - rank(a))

  order.forEach((m) => {
    const forced = m.isMatch || m.state.hover
    const p = points.get(m)

    const onScreen =
      p.x > -40 && p.x < width + 40 && p.y > -40 && p.y < height + 40

    // Far away, or off screen: no label needed.
    if (!forced && (!zoomedIn || !onScreen)) {
      hideLabel(m)
      return
    }

    const w = labelWidth(m.name, forced)
    const h = forced ? 26 : 22

    const rightSide = {
      x1: p.x + 20, y1: p.y - h / 2, x2: p.x + 20 + w, y2: p.y + h / 2,
    }
    const leftSide = {
      x1: p.x - 20 - w, y1: p.y - h / 2, x2: p.x - 20, y2: p.y + h / 2,
    }

    // Try the right of the badge, then the left. If neither is free,
    // the label is hidden (until you zoom in or hover the marker).
    let side = null

    if (!placed.some((r) => rectsOverlap(r, rightSide))) side = 'right'
    else if (!placed.some((r) => rectsOverlap(r, leftSide))) side = 'left'

    if (!side && !forced) {
      hideLabel(m)
      return
    }

    if (!side) side = 'right' // matches and hovered labels always show

    placed.push(side === 'right' ? rightSide : leftSide)

    showLabel(
      m,
      side,
      m.isMatch ? 'match' : m.state.hover ? 'hover' : 'normal'
    )
  })

  return firstMatch
}

export default function MapView({
  locations,
  query,
  searchTrigger,
  sharedLocation,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)
  const userLocationRef = useRef(null)

  const routeDataRef = useRef(EMPTY_ROUTE)

  const showRouteRef = useRef(null)
  const watchIdRef = useRef(null)
  const fullRouteRef = useRef(null)
  const destPointRef = useRef(null)
  const sharedMarkerRef = useRef(null)

  const [view, setView] = useState('street')
  const [loading, setLoading] = useState(true)
  const [routeError, setRouteError] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [shareLabel, setShareLabel] = useState('Share my location')

  const activeCategoryRef = useRef('All')
  // FIX 1: remember the search text so zoomend does not erase the highlight.
  const queryRef = useRef('')
  // Remembers which place we already auto-routed to, so we don't repeat it.
  const autoRouteDestRef = useRef(null)
  // Counts route requests so an older, slower answer can't overwrite a newer one.
  const routeRequestRef = useRef(0)

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STREET_STYLE,
      center: CENTER,
      zoom: 16,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    mapRef.current = map

    map.on('load', () => setLoading(false))

    map.on('style.load', () => {
      if (!map.getSource('route')) {
        map.addSource('route', {
          type: 'geojson',
          data: routeDataRef.current,
        })

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 4,
          },
        })
      }
    })

    // Track the visitor's current location.
    // FIX 3: two separate flags. "settled" is for the promise,
    // "flewToUser" is for recentering the map on the first good fix.
    let settled = false
    let flewToUser = false
    let settleFirstFix

    const firstFixPromise = new Promise((resolve, reject) => {
      settleFirstFix = { resolve, reject }
    })

    // Prevents an "unhandled rejection" warning if nobody is waiting on it.
    firstFixPromise.catch(() => {})

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }

          userLocationRef.current = loc

          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([loc.lng, loc.lat])
          } else {
            const el = document.createElement('div')

            el.className =
              'h-4 w-4 rounded-full border-2 border-white shadow bg-futa-400'

            userMarkerRef.current = new maplibregl.Marker({
              element: el,
            })
              .setLngLat([loc.lng, loc.lat])
              .addTo(map)
          }

          // Keep the displayed route trimmed to the user's current position.
          if (fullRouteRef.current && destPointRef.current) {
            try {
              const line = lineString(fullRouteRef.current)

              const sliced = lineSlice(
                point([loc.lng, loc.lat]),
                destPointRef.current,
                line
              )

              const geojson = {
                type: 'FeatureCollection',
                features: [
                  {
                    type: 'Feature',
                    geometry: sliced.geometry,
                    properties: {},
                  },
                ],
              }

              routeDataRef.current = geojson

              const source = map.getSource('route')

              if (source) {
                source.setData(geojson)
              }
            } catch (err) {
              console.error('Route trim failed:', err)
            }
          }

          if (!flewToUser) {
            flewToUser = true

            map.flyTo({
              center: [loc.lng, loc.lat],
              zoom: 17,
            })
          }

          if (!settled) {
            settled = true
            settleFirstFix.resolve(loc)
          }
        },
        (err) => {
          console.error('Geolocation failed:', err)

          // Only reject once. A later successful fix will still work
          // because the success handler above does not depend on this.
          if (!settled) {
            settled = true
            settleFirstFix.reject(err)
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      )

      watchIdRef.current = watchId
    } else {
      settled = true
      settleFirstFix.reject(
        new Error('Geolocation not supported')
      )
    }

    // Calculate a pedestrian route and show its time and distance.
    async function showRoute(dest) {
      const requestId = ++routeRequestRef.current

      setRouteLoading(true)
      setRouteError(null)
      setRouteInfo(null)

      try {
        const userLoc =
          userLocationRef.current || (await firstFixPromise)

        // A newer search started while we waited, so drop this one.
        if (requestId !== routeRequestRef.current) return

        // The routed-foot server uses its configured pedestrian graph.
        // "driving" is the OSRM-compatible profile name on this endpoint.
        const url =
          `https://routing.openstreetmap.de/routed-foot/route/v1/driving/` +
          `${userLoc.lng},${userLoc.lat};${dest.lng},${dest.lat}` +
          '?overview=full&geometries=geojson'

        const res = await fetch(url)

        if (!res.ok) {
          throw new Error(
            `Routing service returned HTTP ${res.status}`
          )
        }

        const data = await res.json()

        if (requestId !== routeRequestRef.current) return

        const route = data.routes && data.routes[0]

        if (
          data.code !== 'Ok' ||
          !route?.geometry?.coordinates?.length
        ) {
          throw new Error(
            data.message || 'No pedestrian route found'
          )
        }

        fullRouteRef.current = route.geometry.coordinates
        destPointRef.current = point([dest.lng, dest.lat])

        setRouteInfo({
          destination: dest.name || 'Selected destination',
          duration: route.duration,
          distance: route.distance,
        })

        const geojson = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: route.geometry,
              properties: {},
            },
          ],
        }

        routeDataRef.current = geojson

        const source = map.getSource('route')

        if (source) {
          source.setData(geojson)
        }

        // Fit the route and both endpoints into the map.
        const coordinates = route.geometry.coordinates

        const bounds = coordinates.reduce(
          (result, coordinate) => result.extend(coordinate),
          new maplibregl.LngLatBounds(
            coordinates[0],
            coordinates[0]
          )
        )

        map.fitBounds(bounds, {
          padding: {
            top: 90,
            right: 40,
            bottom: 180,
            left: 40,
          },
          maxZoom: 17,
        })
      } finally {
        if (requestId === routeRequestRef.current) {
          setRouteLoading(false)
        }
      }
    }

    showRouteRef.current = showRoute

    // Create the existing location markers.
    markersRef.current = locations.map((loc) => {
      const catStyle = styleFor(loc.category)

      // The ring takes the category colour. Verified places get a small tick.
      const ringColor = catStyle.color

      const wrap = document.createElement('div')
      wrap.style.cssText = 'width:28px;height:28px'

      const dot = document.createElement('div')

      dot.textContent = catStyle.emoji

      dot.style.cssText =
        'position:absolute;left:0;top:0;width:28px;height:28px;' +
        'border-radius:9999px;display:flex;align-items:center;' +
        'justify-content:center;font-size:16px;line-height:1;' +
        'background:#ffffff;border:2px solid ' + ringColor + ';' +
        'box-shadow:0 2px 6px rgba(0,0,0,.35);cursor:pointer;' +
        'transition:transform .15s ease'

      const label = document.createElement('span')
      label.textContent = loc.name
      label.style.display = 'none'

      wrap.append(dot, label)

      if (loc.verified) {
        const tick = document.createElement('span')
        tick.textContent = '✓'
        tick.setAttribute('aria-hidden', 'true')
        tick.style.cssText =
          'position:absolute;right:-5px;top:-5px;width:15px;height:15px;' +
          'border-radius:50%;background:#22c55e;color:#ffffff;' +
          'font-size:10px;font-weight:700;line-height:1;display:flex;' +
          'align-items:center;justify-content:center;' +
          'border:1.5px solid #ffffff;pointer-events:none'
        wrap.appendChild(tick)
      }

      wrap.setAttribute('role', 'button')
      wrap.setAttribute('tabindex', '0')
      wrap.setAttribute('aria-label', loc.name)

      wrap.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          wrap.click()
        }
      })

      const marker = new maplibregl.Marker({
        element: wrap,
      })
        .setLngLat([loc.lng, loc.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 12 }).setDOMContent(
            buildPopup(loc, showRoute)
          )
        )
        .addTo(map)

      const searchText = [
        loc.name,
        ...(loc.aliases || []),
      ]
        .join(' ')
        .toLowerCase()

      const entry = {
        marker,
        dot,
        label,
        ringColor,
        searchText,
        category: loc.category,
        name: loc.name,
        verified: !!loc.verified,
        isMatch: false,
        state: { hover: false },
      }

      // Hovering a marker enlarges it and always shows its name.
      const setHover = (on) => {
        entry.state.hover = on
        dot.style.transform = on ? 'scale(1.18)' : ''
        updateMarkerAppearance(
          map,
          markersRef.current,
          queryRef.current,
          activeCategoryRef.current
        )
      }

      wrap.addEventListener('mouseenter', () => setHover(true))
      wrap.addEventListener('mouseleave', () => setHover(false))

      return entry
    })

    // FIX 1: use the remembered search text instead of ''.
    updateMarkerAppearance(
      map,
      markersRef.current,
      queryRef.current,
      activeCategoryRef.current
    )

    map.on('moveend', () => {
      updateMarkerAppearance(
        map,
        markersRef.current,
        queryRef.current,
        activeCategoryRef.current
      )
    })

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }

      // FIX 4: markers belong to the old map, so forget them.
      // Otherwise a rebuilt map would try to move markers that are gone.
      userMarkerRef.current = null
      sharedMarkerRef.current = null

      map.remove()
    }
  }, [locations])

  // Keep the search and category filtering working.
  useEffect(() => {
    activeCategoryRef.current = activeCategory
    queryRef.current = query // FIX 1

    if (!mapRef.current) return

    const match = updateMarkerAppearance(
      mapRef.current,
      markersRef.current,
      query,
      activeCategory
    )

    if (match) {
      mapRef.current.flyTo({
        center: match.getLngLat(),
        zoom: 17,
      })
    }
  }, [query, activeCategory])

  // Display a shared location and calculate its walking route.
  useEffect(() => {
    if (
      !sharedLocation ||
      !mapRef.current ||
      !showRouteRef.current
    ) {
      return
    }

    const el = document.createElement('div')

    el.className =
      'h-4 w-4 rounded-full border-2 border-white shadow bg-pink-400'

    if (sharedMarkerRef.current) {
      sharedMarkerRef.current.remove()
    }

    sharedMarkerRef.current = new maplibregl.Marker({
      element: el,
    })
      .setLngLat([
        sharedLocation.lng,
        sharedLocation.lat,
      ])
      .setPopup(
        new maplibregl.Popup({ offset: 12 }).setText(
          'Shared location'
        )
      )
      .addTo(mapRef.current)

    mapRef.current.flyTo({
      center: [sharedLocation.lng, sharedLocation.lat],
      zoom: 17,
    })

    setRouteError(null)

    showRouteRef.current({
      lat: sharedLocation.lat,
      lng: sharedLocation.lng,
      name: 'Shared location',
    }).catch((err) => {
      console.error('Directions request failed:', err)

      setRouteError(
        'Could not get a walking route to the shared location.'
      )

      setTimeout(() => setRouteError(null), 6000)
    })
  }, [sharedLocation])

  // Share the user's current location using Firestore.
  async function shareMyLocation() {
    const loc = userLocationRef.current

    if (!loc) {
      setShareLabel('Location not ready yet')

      setTimeout(() => {
        setShareLabel('Share my location')
      }, 2000)

      return
    }

    setShareLabel('Creating link...')

    try {
      const docRef = await addDoc(
        collection(db, 'shares'),
        {
          lat: loc.lat,
          lng: loc.lng,
          createdAt: serverTimestamp(),
          // FIX 5: lets Firestore delete old shares automatically
          // once you add a TTL policy on "expiresAt" in the console.
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        }
      )

      const url =
        `${window.location.origin}${window.location.pathname}?share=${docRef.id}`

      await navigator.clipboard.writeText(url)

      setShareLabel('Copied! (expires in 30 min)')
    } catch (err) {
      console.error('Could not create share link:', err)
      setShareLabel('Could not create link')
    }

    setTimeout(() => {
      setShareLabel('Share my location')
    }, 2500)
  }

  // Find the location that matches the search text (name or aliases).
  function findLocation(text) {
    const q = text.trim().toLowerCase()

    if (!q) return null

    return (
      locations.find((loc) =>
        [loc.name, ...(loc.aliases || [])]
          .join(' ')
          .toLowerCase()
          .includes(q)
      ) || null
    )
  }

  // Ask for a route and show a friendly error if it fails.
  function requestRoute(dest) {
    if (!showRouteRef.current) return

    autoRouteDestRef.current = dest
    setRouteError(null)

    showRouteRef.current(dest).catch((err) => {
      console.error('Directions request failed:', err)

      setRouteError(
        'Could not calculate a walking route. Check your location permission or try again.'
      )

      setTimeout(() => setRouteError(null), 6000)
    })
  }

  // AUTO ROUTE: when the search text matches a place, calculate the route
  // about 0.8 seconds after the person stops typing. No tap needed.
  useEffect(() => {
    const q = query.trim()

    // Search box cleared: allow the same place to be routed again later.
    if (q.length === 0) {
      autoRouteDestRef.current = null
      return
    }

    // Wait for at least 2 letters so we don't route on a single keystroke.
    if (q.length < 2) return

    const dest = findLocation(q)

    // No match, or we already routed to this exact place.
    if (!dest || autoRouteDestRef.current === dest) return

    const timer = setTimeout(() => {
      // The search icon (or a shared link) may already have routed here.
      if (autoRouteDestRef.current === dest) return
      requestRoute(dest)
    }, 800)

    // If they keep typing, cancel and wait again.
    return () => clearTimeout(timer)
  }, [query, locations])

  // Tapping the search icon still works and routes immediately.
  useEffect(() => {
    if (searchTrigger === 0) return

    const dest = findLocation(query)

    if (dest) requestRoute(dest)
  }, [searchTrigger])

  // FIX 2: closing the panel now also removes the blue line
  // and stops it from being trimmed in the background.
  function clearRoute() {
    fullRouteRef.current = null
    destPointRef.current = null
    autoRouteDestRef.current = null
    routeDataRef.current = EMPTY_ROUTE

    const source = mapRef.current?.getSource('route')
    if (source) source.setData(EMPTY_ROUTE)

    setRouteInfo(null)
  }

  const allCategories = [
    ...new Set(locations.map((l) => l.category)),
  ]

  const visibleCategories = [
    'All',
    ...allCategories.slice(0, 3),
  ]

  const overflowCategories = allCategories.slice(3)

  function toggleView(next) {
    setView(next)
    mapRef.current.setStyle(
      next === 'satellite'
        ? SATELLITE_STYLE
        : STREET_STYLE
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-white/10">
      <div
        ref={containerRef}
        className="h-full w-full"
      />

      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-ink/90">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-futa-400" />
          <span className="text-xs text-white/50">
            Loading map…
          </span>
        </div>
      )}

      {routeError && (
        <div
          role="alert"
          // Moves up when the directions panel is showing so they don't overlap.
          className={`absolute left-3 right-3 z-20 rounded-lg border border-red-400/30 bg-red-950/90 px-3 py-2 text-xs text-red-200 ${
            routeInfo ? 'bottom-48' : 'bottom-3'
          }`}
        >
          {routeError}
        </div>
      )}

      {/* Street and satellite map controls */}
      <div className="absolute left-3 top-3 z-10 flex overflow-hidden rounded-lg border border-white/10 bg-ink/90 text-xs">
        <button
          type="button"
          aria-pressed={view === 'street'}
          onClick={() => toggleView('street')}
          className={`px-3 py-1.5 ${
            view === 'street'
              ? 'bg-futa-400/20 text-futa-400'
              : 'text-white/60'
          }`}
        >
          Street
        </button>

        <button
          type="button"
          aria-pressed={view === 'satellite'}
          onClick={() => toggleView('satellite')}
          className={`px-3 py-1.5 ${
            view === 'satellite'
              ? 'bg-futa-400/20 text-futa-400'
              : 'text-white/60'
          }`}
        >
          Satellite
        </button>
      </div>

      {/* Walking directions panel */}
      {routeInfo && (
        <section
          aria-label="Walking directions"
          className="absolute bottom-3 right-3 z-10 w-[min(21rem,calc(100%-1.5rem))] rounded-xl border border-white/10 bg-ink/95 p-4 text-white shadow-xl backdrop-blur"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-white/50">
                Walking directions
              </p>

              <h2 className="mt-1 truncate text-sm font-semibold">
                {routeInfo.destination}
              </h2>
            </div>

            <button
              type="button"
              onClick={clearRoute}
              aria-label="Hide directions panel"
              className="rounded-md px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs text-white/50">
                Estimated time
              </p>

              <p className="mt-1 text-2xl font-bold text-futa-400">
                {routeInfo.duration < 60
                  ? '<1 min'
                  : `${Math.ceil(routeInfo.duration / 60)} min`}
              </p>
            </div>

            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs text-white/50">
                Distance
              </p>

              <p className="mt-1 text-2xl font-bold">
                {routeInfo.distance >= 1000
                  ? `${(routeInfo.distance / 1000).toFixed(2)} km`
                  : `${Math.round(routeInfo.distance)} m`}
              </p>
            </div>
          </div>

          <p className="mt-3 text-[10px] text-white/40">
            Estimates only · Routing by OpenStreetMap contributors
          </p>
        </section>
      )}

      {routeLoading && (
        <div className="absolute bottom-3 right-3 z-10 rounded-lg border border-white/10 bg-ink/95 px-3 py-2 text-xs text-white/70 shadow-lg">
          Calculating walking route…
        </div>
      )}

      {/* Share current location */}
      <button
        type="button"
        onClick={shareMyLocation}
        className="absolute left-3 top-14 z-10 rounded-lg border border-white/10 bg-ink/90 px-3 py-1.5 text-xs text-futa-400"
      >
        {shareLabel}
      </button>

      {/* Category filters */}
      <div className="absolute right-3 top-3 z-10 flex max-w-[65%] flex-wrap items-center justify-end gap-1.5">
        {visibleCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={activeCategory === cat}
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
            value={
              overflowCategories.includes(activeCategory)
                ? activeCategory
                : ''
            }
            onChange={(e) => {
              if (e.target.value) {
                setActiveCategory(e.target.value)
              }
            }}
            className={`rounded-full border px-2 py-1 text-[11px] ${
              overflowCategories.includes(activeCategory)
                ? 'border-futa-400 bg-futa-400/20 text-futa-400'
                : 'border-white/10 bg-ink/90 text-white/60'
            }`}
          >
            <option value="">More</option>

            {overflowCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
