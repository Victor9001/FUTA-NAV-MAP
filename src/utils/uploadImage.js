const CLOUD = 'devlubz8'
const PRESET = 'futanav_events'
const MAX_SIDE = 1600
const MAX_INPUT_BYTES = 10 * 1024 * 1024

function toBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('compress'))),
      'image/jpeg',
      0.8
    )
  })
}

export async function uploadEventImage(file) {
  if (!file) throw new Error('nofile')
  if (file.type && file.type.indexOf('image/') !== 0) throw new Error('type')
  if (file.size > MAX_INPUT_BYTES) throw new Error('big')

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch (e) {
    throw new Error('type')
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  if (bitmap.close) bitmap.close()

  const blob = await toBlob(canvas)

  const body = new FormData()
  body.append('file', blob)
  body.append('upload_preset', PRESET)

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 30000)
  try {
    const res = await fetch(
      'https://api.cloudinary.com/v1_1/' + CLOUD + '/image/upload',
      { method: 'POST', body: body, signal: ctrl.signal }
    )
    if (!res.ok) throw new Error('upload')
    const json = await res.json()
    if (!json.secure_url || json.secure_url.indexOf('https://res.cloudinary.com/' + CLOUD + '/') !== 0) {
      throw new Error('upload')
    }
    return json.secure_url
  } finally {
    clearTimeout(timer)
  }
}