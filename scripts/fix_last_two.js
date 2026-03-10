import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=nl&limit=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'Rittenregistratie/1.0' } })
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
}

async function main() {
  const matrixPath = join(ROOT, 'src/data/matrix_raw.json')
  const matrix = JSON.parse(readFileSync(matrixPath, 'utf-8'))

  // Geocodeer de twee ontbrekende locaties
  const toFind = [
    { name: 'Hof van Pepijn', queries: ['Pepijnpad, 7772, Hardenberg', 'Pepijnpad Hardenberg Baalder', 'Baalder Hardenberg Netherlands'] },
    { name: 'Ziekenhuis Hardenberg', queries: ['Jan Weitkamplaan 4, Hardenberg', 'Saxenburgh ziekenhuis Hardenberg', 'Jan Weitkamplaan Hardenberg'] },
  ]

  const newCoords = {}

  for (const loc of toFind) {
    let found = false
    for (const q of loc.queries) {
      try {
        console.log(`Probeer: ${loc.name} -> "${q}"`)
        const result = await geocode(q)
        newCoords[loc.name] = result
        console.log(`  OK: [${result.lat}, ${result.lon}] - ${result.display}`)
        found = true
        break
      } catch (err) {
        console.log(`  Niet gevonden, volgende proberen...`)
      }
      await sleep(1100)
    }
    if (!found) console.error(`  FOUT: ${loc.name} kon niet worden gevonden`)
    await sleep(1100)
  }

  // Bereken afstanden voor alle 0-paren met deze locaties
  const allCoords = { ...KNOWN_COORDS, ...newCoords }
  let count = 0

  for (const [key, val] of Object.entries(matrix)) {
    if (val !== 0) continue
    const [a, b] = key.split('|')
    if (a === b) continue

    // Alleen als een van de twee een nieuw-gevonden locatie is
    if (!newCoords[a] && !newCoords[b]) continue
    if (!allCoords[a] || !allCoords[b]) continue

    const reverseKey = `${b}|${a}`
    if (matrix[reverseKey] !== undefined && matrix[reverseKey] !== 0) {
      matrix[key] = matrix[reverseKey]
      continue
    }

    try {
      const dist = await routeDistance(allCoords[a], allCoords[b])
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

  writeFileSync(matrixPath, JSON.stringify(matrix, null, 2), 'utf-8')

  // Regenereer matrix.js
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

  const remaining = Object.entries(matrix).filter(([k, v]) => {
    const [a, b] = k.split('|')
    return v === 0 && a !== b
  }).length
  console.log(`\nmatrix.js bijgewerkt. Resterende 0-km entries: ${remaining}`)
}

main().catch(err => { console.error(err); process.exit(1) })
