// services/cronTrash.js — Purge automatique de la corbeille (30 jours)
import { supabase } from '../config.js'

const TABLES = ['tracks', 'albums', 'playlists', 'events', 'products']
const RETENTION_DAYS = 30
const INTERVAL_MS = 24 * 60 * 60 * 1000
const FIRST_RUN_DELAY_MS = 60 * 1000

export async function purgeTrash(log) {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  let totalPurged = 0
  for (const t of TABLES) {
    const { data, error } = await supabase.from(t)
      .delete()
      .lt('deleted_at', cutoff)
      .not('deleted_at', 'is', null)
      .select('id')
    if (error) {
      log.error({ err: error, table: t }, '[CRON-TRASH] purge failed')
      continue
    }
    const n = (data || []).length
    if (n > 0) log.info({ table: t, count: n }, '[CRON-TRASH] purged')
    totalPurged += n
  }
  log.info({ totalPurged, cutoff }, '[CRON-TRASH] cycle complete')
  return totalPurged
}

export function startCronTrash(log) {
  console.log('[CRON-TRASH] scheduling: first run in 60s, then every 24h')
  setTimeout(() => {
    purgeTrash(log).catch(e => log.error({ err: e }, '[CRON-TRASH] uncaught'))
    setInterval(() => {
      purgeTrash(log).catch(e => log.error({ err: e }, '[CRON-TRASH] uncaught'))
    }, INTERVAL_MS)
  }, FIRST_RUN_DELAY_MS)
}
