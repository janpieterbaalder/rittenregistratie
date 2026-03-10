/**
 * Fix de 4 locaties die niet gevonden werden door Nominatim
 * met alternatieve zoektermen.
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=nl&limit=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Rittenregistratie/1.0 (baalderborg-groep)' }
  })
  const data = await res.json()
  if (!data.length) throw new Error(`Niet gevonden: ${query}`)
  return { lon: parseFloat(data[0].lon), lat: parseFloat(data[0].lat), display: data[0].display_name }
}

async function routeDistance(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`
  const res = await fetch(url)
  const data = await res.json()
  if (data.code !== 'Ok') throw new Error('Geen route')
  return Math.round(data.routes[0].distance / 1000)
}

// Locaties die niet gevonden werden, met alternatieve zoektermen
const MISSING = [
  { name: 'Punt', query: 'Van Opstallstraat, Rijssen, Netherlands' },
  { name: 'Mulert', query: 'Mulert, Ommen, Netherlands' },
  { name: 'Hof van Pepijn', query: 'Pepijnpad, Hardenberg, Netherlands' },
  { name: 'Ziekenhuis Hardenberg', query: 'Röpcke-Zweers Ziekenhuis, Hardenberg, Netherlands' },
]

// Alle andere locaties die al geocodeerd zijn (uit vorige run)
const KNOWN_COORDS = {
  'Keet': { lon: 6.6369801, lat: 52.5736992 },
  'Hoogenweg': { lon: 6.6603977, lat: 52.5670787 },
  'Vlasakkerkamp': { lon: 6.6366113, lat: 52.571301 },
  'Spindel': { lon: 6.6369504, lat: 52.573479 },
  'Oldenburg': { lon: 6.6374536, lat: 52.5724263 },
  'Niehof': { lon: 6.6376453, lat: 52.5728279 },
  'Holte': { lon: 6.6372411, lat: 52.573106 },
  'Baaldergroen': { lon: 6.6358524, lat: 52.5722375 },
  'Pijlkruid': { lon: 6.646049, lat: 52.5748126 },
  'Roots': { lon: 6.6228553, lat: 52.5644972 },
  'Koppeling': { lon: 6.5911136, lat: 52.573343 },
  'Grasklokje 80': { lon: 6.6446386, lat: 52.5790092 },
  'Grasklokje 45': { lon: 6.6449239, lat: 52.5787151 },
  'Blanckvoortallee': { lon: 6.6022327, lat: 52.5769063 },
  'Gilde': { lon: 6.6731932, lat: 52.6108746 },
  'Wanne': { lon: 6.6278136, lat: 52.5764576 },
  'Mauritshof': { lon: 6.5265258, lat: 52.2998355 },
  'Fluitekruid': { lon: 6.4916898, lat: 52.3114824 },
  'Hazelaar': { lon: 6.422942, lat: 52.5255464 },
  'Vlinder': { lon: 6.4229095, lat: 52.5282172 },
  'Linde': { lon: 6.422942, lat: 52.5255464 },
  'Esrand': { lon: 6.422942, lat: 52.5255464 },
  'Alteveer': { lon: 6.4183253, lat: 52.5300403 },
  'Hei en Dennen': { lon: 6.4120996, lat: 52.5259021 },
  'Gerard Doustraat': { lon: 6.4340677, lat: 52.5356679 },
  'Dante': { lon: 6.4120996, lat: 52.5259021 },
  'De Elzenhoek': { lon: 6.4229095, lat: 52.5282172 },
  'Jeruzalemweg': { lon: 6.4776454, lat: 52.3774519 },
  'Nicolaas Beetsstraat': { lon: 6.4674467, lat: 52.3576963 },
  'Ons Straatje': { lon: 6.4774175, lat: 52.3776987 },
  'Dahliastraat': { lon: 6.4657696, lat: 52.3621317 },
  'Erasmuslaan': { lon: 6.1380803, lat: 52.5220763 },
  'Isala': { lon: 6.1249042, lat: 52.5134572 },
}

async function main() {
  const matrixPath = join(ROOT, 'src/data/matrix_raw.json')
  const matrix = JSON.parse(readFileSync(matrixPath, 'utf-8'))

  // Stap 1: Geocodeer ontbrekende locaties
  const newCoords = { ...KNOWN_COORDS }

  for (const loc of MISSING) {
    try {
      console.log(`Geocoding: ${loc.name} (${loc.query})`)
      const result = await geocode(loc.query)
      newCoords[loc.name] = result
      console.log(`  OK: [${result.lat}, ${result.lon}] - ${result.display}`)
      await sleep(1100)
    } catch (err) {
      console.error(`  FOUT: ${err.message}`)
    }
  }

  // Stap 2: Bereken afstanden voor alle paren die nog 0 zijn
  const allNames = Object.keys(newCoords)
  let count = 0

  for (const [key, val] of Object.entries(matrix)) {
    if (val !== 0) continue
    const [a, b] = key.split('|')
    if (a === b) continue
    if (!newCoords[a] || !newCoords[b]) continue

    // Check of we al de omgekeerde richting hebben berekend
    const reverseKey = `${b}|${a}`
    if (matrix[reverseKey] !== undefined && matrix[reverseKey] !== 0) {
      matrix[key] = matrix[reverseKey]
      continue
    }

    try {
      const dist = await routeDistance(newCoords[a], newCoords[b])
      matrix[key] = dist
      matrix[reverseKey] = dist
      console.log(`${a} <-> ${b}: ${dist} km`)
      count++
      await sleep(200)
    } catch (err) {
      console.error(`FOUT: ${a} <-> ${b}: ${err.message}`)
    }
  }

  console.log(`\n${count} extra afstanden berekend.`)

  // Stap 3: Opslaan
  writeFileSync(matrixPath, JSON.stringify(matrix, null, 2), 'utf-8')

  // Stap 4: Regenereer matrix.js
  const lines = ['// Afstandsmatrix - afstanden in km tussen locaties']
  lines.push('// Gegenereerd uit Excel + gecorrigeerd met OSRM routeberekening')
  lines.push('// Key format: "Van|Naar" -> km')
  lines.push('')
  lines.push('const MATRIX_DATA = {')
  for (const key of Object.keys(matrix).sort()) {
    lines.push(`  "${key}": ${matrix[key]},`)
  }
  lines.push('}')
  lines.push('')
  lines.push('export function getDistance(from, to) {')
  lines.push('  if (from === to) return 0')
  lines.push('  const key1 = `${from}|${to}`')
  lines.push('  const key2 = `${to}|${from}`')
  lines.push('  if (MATRIX_DATA[key1] !== undefined) return MATRIX_DATA[key1]')
  lines.push('  if (MATRIX_DATA[key2] !== undefined) return MATRIX_DATA[key2]')
  lines.push('  return null')
  lines.push('}')
  lines.push('')
  lines.push('export function getAllLocationNames() {')
  lines.push('  const names = new Set()')
  lines.push('  for (const key of Object.keys(MATRIX_DATA)) {')
  lines.push('    const [from, to] = key.split("|")')
  lines.push('    names.add(from)')
  lines.push('    names.add(to)')
  lines.push('  }')
  lines.push('  return [...names].sort()')
  lines.push('}')

  writeFileSync(join(ROOT, 'src/data/matrix.js'), lines.join('\n'), 'utf-8')

  // Samenvatting
  const remaining = Object.entries(matrix).filter(([k, v]) => {
    const [a, b] = k.split('|')
    return v === 0 && a !== b
  }).length
  console.log(`\nmatrix.js bijgewerkt. Resterende 0-km entries: ${remaining}`)
}

main().catch(err => { console.error(err); process.exit(1) })
