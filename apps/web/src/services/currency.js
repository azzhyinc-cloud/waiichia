import api from './api.js'

// Cache des taux — rechargé toutes les 10 minutes max
let ratesCache = null
let ratesCacheTime = 0
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

export async function loadRates() {
  if (ratesCache && Date.now() - ratesCacheTime < CACHE_TTL) return ratesCache
  try {
    const data = await api.currency.rates()
    ratesCache = data.rates || {}
    ratesCacheTime = Date.now()
    return ratesCache
  } catch (e) {
    console.error('[currency] Failed to load rates:', e.message)
    return ratesCache || {}
  }
}

/**
 * Convertit un montant d'une devise à une autre
 * Utilise le cache local, fallback sur des taux approximatifs
 */
export function convertAmount(amount, from = 'KMF', to = 'KMF', rates = null) {
  if (!amount || from === to) return amount
  const r = rates || ratesCache || {}

  // Taux direct
  const directKey = from + '_' + to
  if (r[directKey]) return Math.round(amount * r[directKey] * 100) / 100

  // Taux inverse
  const reverseKey = to + '_' + from
  if (r[reverseKey]) return Math.round(amount / r[reverseKey] * 100) / 100

  // Via KMF comme pivot (from → KMF → to)
  if (from !== 'KMF' && to !== 'KMF') {
    const toKMF = r[from + '_KMF'] || (r['KMF_' + from] ? 1 / r['KMF_' + from] : null)
    const fromKMF = r['KMF_' + to] || (r[to + '_KMF'] ? 1 / r[to + '_KMF'] : null)
    if (toKMF && fromKMF) return Math.round(amount * toKMF * fromKMF * 100) / 100
  }

  return null // Pas de taux disponible
}

/**
 * Formatte un montant avec sa devise
 */
export function formatMoney(amount, currency = 'KMF') {
  if (amount === null || amount === undefined) return '—'
  const formatted = Math.abs(amount).toLocaleString('fr-FR')
  return formatted + ' ' + currency
}

/**
 * Affiche un prix converti avec le symbole ≈
 */
export function convertedDisplay(amount, fromCurrency = 'KMF', toCurrency = 'KMF', rates = null) {
  if (fromCurrency === toCurrency) return formatMoney(amount, fromCurrency)
  const converted = convertAmount(amount, fromCurrency, toCurrency, rates)
  if (converted === null) return formatMoney(amount, fromCurrency)
  return '≈ ' + formatMoney(converted, toCurrency)
}

// Taux de fallback approximatifs (si la DB est vide)
export const FALLBACK_RATES = {
  KMF_USD: 0.00204,
  KMF_EUR: 0.00203,
  KMF_GBP: 0.00172,
  KMF_MGA: 9.38,
  KMF_TZS: 5.27,
  KMF_RWF: 2.72,
  KMF_XOF: 1.335,
  KMF_XAF: 1.335,
  KMF_NGN: 3.33,
  KMF_CDF: 5.67,
  KMF_KES: 0.264,
  KMF_GHS: 0.033,
  KMF_ETB: 0.237,
  KMF_MAD: 0.0204,
  KMF_DZD: 0.275,
  KMF_TND: 0.00636,
}
