import { initializeFirestore } from 'firebase/firestore'
import { app } from './firebase'

export const db = initializeFirestore(
  app,
  { experimentalAutoDetectLongPolling: true },
  'default'
)