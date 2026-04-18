/**
 * Convertit un code pays ISO 2 lettres en emoji drapeau
 * Ex: "KM" → "🇰🇲", "MG" → "🇲🇬", "FR" → "🇫🇷"
 */
export function getFlag(code) {
  if (!code || typeof code !== 'string') return '🌍'
  const clean = code.trim().toUpperCase().replace(/[^A-Z]/g, '')
  if (clean.length !== 2) return '🌍'
  return String.fromCodePoint(...[...clean].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
}

/**
 * Retourne "drapeau + nom" pour un code pays
 */
const COUNTRY_NAMES = {
  KM: 'Comores', MG: 'Madagascar', TZ: 'Tanzanie', RW: 'Rwanda',
  CI: "Côte d'Ivoire", NG: 'Nigeria', SN: 'Sénégal', CD: 'RD Congo',
  CG: 'Congo', GH: 'Ghana', FR: 'France', US: 'États-Unis',
  GB: 'Royaume-Uni', BE: 'Belgique', CA: 'Canada', DJ: 'Djibouti',
  ET: 'Éthiopie', KE: 'Kenya', UG: 'Ouganda', ZA: 'Afrique du Sud',
  MA: 'Maroc', TN: 'Tunisie', DZ: 'Algérie', ML: 'Mali',
  BF: 'Burkina Faso', CM: 'Cameroun', BJ: 'Bénin', TG: 'Togo',
  NE: 'Niger', GA: 'Gabon', MU: 'Maurice', SC: 'Seychelles',
  YT: 'Mayotte', RE: 'Réunion',
}

export function getFlagName(code) {
  if (!code) return '🌍 Monde'
  const clean = code.trim().toUpperCase().replace(/[^A-Z]/g, '')
  return getFlag(clean) + ' ' + (COUNTRY_NAMES[clean] || clean)
}
