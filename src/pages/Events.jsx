import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firestore'
import { useAuth } from '../context/AuthContext'
import { withTimeout } from '../utils/withTimeout'

const MapPicker = lazy(() => import('../components/MapPicker'))

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID
const DAY_MS = 24 * 60 * 60 * 1000
const BOX = { latMin: 7.2, latMax: 7.4, lngMin: 5.05, lngMax: 5.25 }
const EMPTY = { title: '', when: '', locationNote: '', details: '' }

function fmtWhen(ts) {
  try {
    return ts.toDate().toLocaleString('en-NG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch (err) {
    return ''
  }
}

function startMs(ev) {
  return ev.startsAt && ev.startsAt.toMillis ? ev.startsAt.toMillis() : 0
}

function isLive(ev) {
  const end = ev.expiresAt && ev.expiresAt.toMillis ? ev.expiresAt.toMillis() : 0
  return end > Date.now()
}

function toList(snap) {
  if (!snap) return []
  return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()))
}

function EventCard({ ev, isAdmin, onApprove, onReject, onDelete, note }) {
  return (
    <li className="rounded-xl border border-white/10 bg-ink/95 p-4">
      <h3 className="text-base font-semibold">{ev.title}</h3>
      <p className="mt-1 text-sm text-futa-400">{fmtWhen(ev.startsAt)}</p>
      <p className="mt-1 text-sm text-white/70">{ev.locationNote}</p>
      {ev.details && <p className="mt-2 text-sm text-white/60">{ev.details}</p>}
      {note && <p className="mt-2 text-xs text-amber-300">{note}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link
          to={'/?lat=' + ev.lat + '&lng=' + ev.lng}
          className="rounded-lg bg-futa-400/20 px-3 py-1.5 text-sm text-futa-400"
        >
          Get directions
        </Link>
        {onApprove && (
          <button
            type="button"
            onClick={() => onApprove(ev.id)}
            className="rounded-lg bg-futa-400 px-3 py-1.5 text-sm font-medium text-ink"
          >
            Approve
          </button>
        )}
        {onReject && (
          <button
            type="button"
            onClick={() => onReject(ev.id)}
            className="text-sm text-white/60 hover:text-white"
          >
            Reject
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(ev.id)}
            className="text-sm text-white/50 hover:text-white"
          >
            Delete
          </button>
        )}
        {isAdmin && !isLive(ev) && (
          <span className="text-xs text-white/40">Expired</span>
        )}
      </div>
    </li>
  )
}

export default function Events() {
  const { currentUser, loading: authLoading } = useAuth()
  const uid = currentUser ? currentUser.uid : null
  const isAdmin = Boolean(ADMIN_UID) && uid === ADMIN_UID

  const [approved, setApproved] = useState([])
  const [pending, setPending] = useState([])
  const [mine, setMine] = useState([])
  const [status, setStatus] = useState('loading')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [pin, setPin] = useState(null)
  const [pickerKey, setPickerKey] = useState(0)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const col = collection(db, 'events')
      const approvedSnap = await getDocs(
        query(col, where('status', '==', 'approved'), limit(100))
      )
      let pendingSnap = null
      let mineSnap = null
      if (isAdmin) {
        pendingSnap = await getDocs(
          query(col, where('status', '==', 'pending'), limit(50))
        )
      } else if (uid) {
        mineSnap = await getDocs(
          query(col, where('submittedByUid', '==', uid), limit(20))
        )
      }
      setApproved(toList(approvedSnap).sort((a, b) => startMs(a) - startMs(b)))
      setPending(toList(pendingSnap).sort((a, b) => startMs(a) - startMs(b)))
      setMine(toList(mineSnap).sort((a, b) => startMs(a) - startMs(b)))
      setStatus('ready')
    } catch (err) {
      console.error('Events load failed:', err)
      setStatus('error')
    }
  }, [isAdmin, uid])

  useEffect(() => {
    if (authLoading) return
    load()
  }, [authLoading, load])

  function setField(key, value) {
    setForm((f) => Object.assign({}, f, { [key]: value }))
  }

  function openForm() {
    setMsg('')
    setShowForm(true)
  }

  function closeForm() {
    setMsg('')
    setShowForm(false)
  }

  async function submit(e) {
    e.preventDefault()
    setMsg('')
    const title = form.title.trim()
    const note = form.locationNote.trim()
    const details = form.details.trim()
    const start = new Date(form.when)

    if (title.length < 3) return setMsg('Add a title of at least 3 characters.')
    if (!form.when || Number.isNaN(start.getTime())) return setMsg('Pick the date and time.')
    if (start.getTime() < Date.now() + 60000) return setMsg('Pick a time in the future.')
    if (start.getTime() > Date.now() + 170 * DAY_MS) return setMsg('Pick a date within the next 5 months.')
    if (!pin) return setMsg('Tap the map to drop a pin where it is happening.')
    if (pin.lat < BOX.latMin || pin.lat > BOX.latMax || pin.lng < BOX.lngMin || pin.lng > BOX.lngMax) {
      return setMsg('The pin must be on or near campus.')
    }
    if (note.length < 3) return setMsg('Describe the spot, for example: behind the main auditorium.')

    setSaving(true)
    try {
      const startTs = Timestamp.fromDate(start)
      const data = {
        title: title,
        startsAt: startTs,
        expiresAt: Timestamp.fromMillis(startTs.toMillis() + DAY_MS),
        lat: pin.lat,
        lng: pin.lng,
        locationNote: note,
        status: 'pending',
        submittedByUid: uid,
        createdAt: serverTimestamp(),
      }
      if (details) data.details = details
      await withTimeout(addDoc(collection(db, 'events'), data))
      setForm(EMPTY)
      setPin(null)
      setPickerKey((k) => k + 1)
      setShowForm(false)
      setMsg('Sent. It will show after it is approved.')
      await load()
    } catch (err) {
      console.error('Event submit failed:', err)
      setMsg(err && err.message === 'timeout'
        ? 'No connection. It may still send, so check before sending again.'
        : 'Could not send. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function review(id, next) {
    try {
      await updateDoc(doc(db, 'events', id), { status: next })
      await load()
    } catch (err) {
      console.error('Event review failed:', err)
      setMsg('Could not update. Try again.')
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this event?')) return
    try {
      await deleteDoc(doc(db, 'events', id))
      await load()
    } catch (err) {
      console.error('Event delete failed:', err)
      setMsg('Could not delete. Try again.')
    }
  }

  const field =
    'mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-futa-400'

  const visible = isAdmin ? approved : approved.filter(isLive)
  const hasEvents = status === 'ready' && visible.length > 0

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Events at FUTA</h1>
          <p className="mt-1 text-sm text-white/60">
            Upcoming events on campus. Tap Get directions to see how to get there.
          </p>
        </div>
        {hasEvents && !showForm && (
          <button
            type="button"
            onClick={openForm}
            aria-label="Add an event"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-futa-400 text-ink"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}
      </div>

      {msg && !showForm && (
        <p role="status" className="mt-4 text-sm text-white/70">{msg}</p>
      )}

      {showForm && (
        <section className="mt-6 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Add an event</h2>
            <button
              type="button"
              onClick={closeForm}
              aria-label="Close"
              className="rounded-md p-1 text-white/60 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {!currentUser ? (
            <p className="mt-2 text-sm text-white/60">
              Sign in first. Events show only after they are approved.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-3 flex flex-col gap-3">
              <label className="text-sm text-white/70">
                Event name
                <input
                  className={field}
                  maxLength={80}
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                />
              </label>
              <label className="text-sm text-white/70">
                Date and time
                <input
                  type="datetime-local"
                  className={field}
                  value={form.when}
                  onChange={(e) => setField('when', e.target.value)}
                />
              </label>
              <label className="text-sm text-white/70">
                Where exactly is it?
                <textarea
                  className={field}
                  rows={2}
                  maxLength={200}
                  placeholder="Example: open field behind the main auditorium"
                  value={form.locationNote}
                  onChange={(e) => setField('locationNote', e.target.value)}
                />
              </label>
              <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-lg bg-white/5" />}>
                <MapPicker key={pickerKey} value={pin} onChange={setPin} />
              </Suspense>
              <label className="text-sm text-white/70">
                More details (optional)
                <textarea
                  className={field}
                  rows={3}
                  maxLength={500}
                  value={form.details}
                  onChange={(e) => setField('details', e.target.value)}
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-futa-400 py-2 text-sm font-medium text-ink disabled:opacity-60"
              >
                {saving ? 'Sending...' : 'Send for approval'}
              </button>
            </form>
          )}
          {msg && <p role="status" className="mt-3 text-sm text-white/70">{msg}</p>}
        </section>
      )}

      {status === 'loading' && <p className="mt-6 text-sm text-white/50">Loading...</p>}
      {status === 'error' && (
        <p className="mt-6 text-sm text-red-400">Could not load events. Try again in a moment.</p>
      )}

      {status === 'ready' && visible.length === 0 && !showForm && (
        <div className="mt-16 flex flex-col items-center text-center">
          <p className="text-lg font-medium">No events yet</p>
          <p className="mt-1 text-sm text-white/50">Tap the plus to add one.</p>
          <button
            type="button"
            onClick={openForm}
            aria-label="Add an event"
            className="mt-6 flex h-24 w-24 items-center justify-center rounded-full bg-futa-400 text-ink shadow-lg"
          >
            <Plus className="h-12 w-12" />
          </button>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {visible.map((ev) => (
          <EventCard
            key={ev.id}
            ev={ev}
            isAdmin={isAdmin}
            onDelete={isAdmin ? remove : null}
          />
        ))}
      </ul>

      {isAdmin && pending.length > 0 && (
        <section className="mt-10">
          <h2 className="text-base font-semibold">Waiting for your approval ({pending.length})</h2>
          <ul className="mt-3 space-y-3">
            {pending.map((ev) => (
              <EventCard
                key={ev.id}
                ev={ev}
                isAdmin={isAdmin}
                onApprove={(id) => review(id, 'approved')}
                onReject={(id) => review(id, 'rejected')}
                onDelete={remove}
              />
            ))}
          </ul>
        </section>
      )}

      {!isAdmin && mine.filter((ev) => ev.status !== 'approved').length > 0 && (
        <section className="mt-10">
          <h2 className="text-base font-semibold">Your submissions</h2>
          <ul className="mt-3 space-y-3">
            {mine
              .filter((ev) => ev.status !== 'approved')
              .map((ev) => (
                <EventCard
                  key={ev.id}
                  ev={ev}
                  isAdmin={false}
                  onDelete={remove}
                  note={ev.status === 'rejected' ? 'Not approved.' : 'Waiting for approval.'}
                />
              ))}
          </ul>
        </section>
      )}
    </div>
  )
}