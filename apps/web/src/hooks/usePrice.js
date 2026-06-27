import { useEffect, useState } from 'react'
import { useDeviseStore } from '../stores/index.js'
import api from '../services/api.js'

let ratesCache = null
let ratesFetchedAt = 0
const CACHE_TTL = 10 * 60 * 1000

async function getRates() {
  if (ratesCache && Date.now() - ratesFetchedAt < CACHE_TTL) return ratesCache
  try {
    const res = await api.currency.rates('KMF')
    ratesCache = res.rates || {}
    ratesFetchedAt = Date.now()
    return ratesCache
  } catch {
    return ratesCache || {}
  }
}

export function usePrice() {
  const { devise } = useDeviseStore()
  const [rates, setRates] = useState(ratesCache || {})

  useEffect(() => {
    getRates().then(setRates)
  }, [devise?.code])

  function format(amountKMF) {
    if (!amountKMF && amountKMF !== 0) return '—'
    const code = devise?.code || 'KMF'
    if (code === 'KMF') return amountKMF.toLocaleString('fr-FR') + ' KMF'
    const key = 'KMF_' + code
    const rate = rates[key]
    if (!rate) return amountKMF.toLocaleString('fr-FR') + ' KMF'
    const converted = Math.round(amountKMF * rate * 100) / 100
    const noDecimals = ['KMF','MGA','TZS','RWF','XOF','XAF','NGN','CDF'].includes(code)
    const decimals = noDecimals ? 0 : 2
    return converted.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + ' ' + code
  }

  return { format, rates, devise }
}
