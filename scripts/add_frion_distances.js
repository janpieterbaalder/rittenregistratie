/**
 * Voeg Frion-locaties toe aan de afstandsmatrix.
 * Berekent afstanden tussen alle Frion-locaties EN tussen Frion en bestaande locaties.
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
  const res = await fetch(url, { headers: { 'User-Agent': 'Rittenregistratie/1.0 (baalderborg-groep)' } })
  const data = await res.json()
  if (!data.length) throw new Error(`Niet gevonden: ${query}`)
  return { lon: parseFloat(data[0].lon), lat: parseFloat(data[0].lat) }
}

async function routeDistance(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`
  const res = await fetch(url)
  const data = await res.json()
  if (data.code !== 'Ok') throw new Error('Geen route')
  return Math.round(data.routes[0].distance / 1000)
}

// Bestaande locatie-coordinaten (uit vorige runs)
const EXISTING_COORDS = {
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
  'Hof van Pepijn': { lon: 6.6391662, lat: 52.583697 },
  'Ziekenhuis Hardenberg': { lon: 6.6294997, lat: 52.5711762 },
  'Vlinder': { lon: 6.4229095, lat: 52.5282172 },
  'De Elzenhoek': { lon: 6.4229095, lat: 52.5282172 },
  'Hazelaar': { lon: 6.422942, lat: 52.5255464 },
  'Linde': { lon: 6.422942, lat: 52.5255464 },
  'Esrand': { lon: 6.422942, lat: 52.5255464 },
  'Alteveer': { lon: 6.4183253, lat: 52.5300403 },
  'Hei en Dennen': { lon: 6.4120996, lat: 52.5259021 },
  'Mulert': { lon: 6.4288479, lat: 52.5190123 },
  'Gerard Doustraat': { lon: 6.4340677, lat: 52.5356679 },
  'Dante': { lon: 6.4120996, lat: 52.5259021 },
  'Mauritshof': { lon: 6.5265258, lat: 52.2998355 },
  'Fluitekruid': { lon: 6.4916898, lat: 52.3114824 },
  'Punt': { lon: 6.5130634, lat: 52.3027025 },
  'Jeruzalemweg': { lon: 6.4776454, lat: 52.3774519 },
  'Nicolaas Beetsstraat': { lon: 6.4674467, lat: 52.3576963 },
  'Ons Straatje': { lon: 6.4774175, lat: 52.3776987 },
  'Dahliastraat': { lon: 6.4657696, lat: 52.3621317 },
  'Erasmuslaan': { lon: 6.1380803, lat: 52.5220763 },
  'Isala': { lon: 6.1249042, lat: 52.5134572 },
  'Ijsselbolder': { lon: 6.0929, lat: 52.5108 },  // approx Zwolle
  'Frankhuizerallee': { lon: 6.1102, lat: 52.5351 }, // approx
  'Govert Flinckstraat': { lon: 6.1157, lat: 52.5131 }, // approx
  'Werkeren': { lon: 6.1405, lat: 52.5181 }, // approx
}

// Frion-locaties om toe te voegen
const FRION_LOCATIONS = [
  { name: 'Prunuspark', address: 'Prunuspark 35, Zwolle, Netherlands' },
  { name: 'Bachlaan', address: 'Bachlaan 4, Zwolle, Netherlands' },
  { name: 'Beulakerwiede', address: 'Beulakerwiede 25, Zwolle, Netherlands' },
  { name: 'Nicolaihof', address: 'Thorbeckegracht 42, Zwolle, Netherlands' },
  { name: 'Schumannlaan', address: 'Schumannlaan 2, Zwolle, Netherlands' },
  { name: 'Ternatestraat', address: 'Ternatestraat 7, Zwolle, Netherlands' },
  { name: 'Staatsmanlaan', address: 'Staatsmanlaan 131, Zwolle, Netherlands' },
  { name: 'Wismarstraat', address: 'Wismarstraat 2, Zwolle, Netherlands' },
  { name: 'De Stadshoeve', address: 'Schuurmanstraat 10, Zwolle, Netherlands' },
  { name: 'De Schellerhoeve', address: 'Schellerpad 2, Zwolle, Netherlands' },
  { name: 'Oldpark', address: 'Oldeneelallee 2, Zwolle, Netherlands' },
  { name: 'Anjelierstraat', address: 'Anjelierstraat 2, Steenwijk, Netherlands' },
  { name: 'Onnastraat', address: 'Onnastraat 2, Steenwijk, Netherlands' },
  { name: 'Van Goghstraat', address: 'Van Goghstraat 1, Steenwijk, Netherlands' },
  { name: "'t Goor", address: "'t Goor, Baars, Netherlands" },
  { name: 'Dagcentrum De Slinger', address: 'Tukseweg 132, Steenwijk, Netherlands' },
  { name: 'Frans Halsstraat', address: 'Frans Halsstraat 26, Steenwijk, Netherlands' },
]

// Selectie van bestaande locaties om afstanden naar te berekenen
// (niet alle 53 nodig; we kiezen representatieve locaties per cluster)
const KEY_EXISTING = [
  'Keet', 'Vlinder', 'Jeruzalemweg', 'Mauritshof',
  'Erasmuslaan', 'Isala', 'Ijsselbolder', 'Frankhuizerallee',
  'Govert Flinckstraat', 'Werkeren', 'Frans Halsstraat',
]

async function main() {
  const matrixPath = join(ROOT, 'src/data/matrix_raw.json')
  const matrix = JSON.parse(readFileSync(matrixPath, 'utf-8'))

  // Stap 1: Geocodeer Frion-locaties
  console.log(`=== Stap 1: ${FRION_LOCATIONS.length} Frion-locaties geocoderen ===\n`)
  const frionCoords = {}

  for (const loc of FRION_LOCATIONS) {
    // Skip Frans Halsstraat - al in bestaande matrix
    if (EXISTING_COORDS[loc.name]) {
      frionCoords[loc.name] = EXISTING_COORDS[loc.name]
      console.log(`  SKIP (al bekend): ${loc.name}`)
      continue
    }
    try {
      const coords = await geocode(loc.address)
      frionCoords[loc.name] = coords
      console.log(`  OK: ${loc.name} -> [${coords.lat}, ${coords.lon}]`)
    } catch (err) {
      console.error(`  FOUT: ${loc.name}: ${err.message}`)
    }
    await sleep(1100)
  }

  const allCoords = { ...EXISTING_COORDS, ...frionCoords }
  const frionNames = Object.keys(frionCoords)
  console.log(`\n${frionNames.length} Frion-locaties klaar.\n`)

  // Stap 2: Bereken Frion <-> Frion afstanden
  console.log(`=== Stap 2: Frion onderling ===\n`)
  let count = 0

  for (let i = 0; i < frionNames.length; i++) {
    for (let j = i + 1; j < frionNames.length; j++) {
      const a = frionNames[i]
      const b = frionNames[j]
      if (!allCoords[a] || !allCoords[b]) continue

      const k1 = `${a}|${b}`
      const k2 = `${b}|${a}`
      if (matrix[k1] !== undefined && matrix[k1] !== null) continue

      try {
        const dist = await routeDistance(allCoords[a], allCoords[b])
        matrix[k1] = dist
        matrix[k2] = dist
        console.log(`  ${a} <-> ${b}: ${dist} km`)
        count++
        await sleep(200)
      } catch (err) {
        console.error(`  FOUT: ${a} <-> ${b}: ${err.message}`)
      }
    }
  }
  console.log(`\n${count} Frion-onderling afstanden berekend.\n`)

  // Stap 3: Bereken Frion <-> key bestaande locaties
  console.log(`=== Stap 3: Frion <-> bestaande locaties ===\n`)
  let count2 = 0

  for (const frion of frionNames) {
    if (!allCoords[frion]) continue
    for (const existing of KEY_EXISTING) {
      if (!allCoords[existing]) continue
      if (frion === existing) continue

      const k1 = `${frion}|${existing}`
      const k2 = `${existing}|${frion}`
      if (matrix[k1] !== undefined && matrix[k1] !== null) continue

      try {
        const dist = await routeDistance(allCoords[frion], allCoords[existing])
        matrix[k1] = dist
        matrix[k2] = dist
        console.log(`  ${frion} <-> ${existing}: ${dist} km`)
        count2++
        await sleep(200)
      } catch (err) {
        console.error(`  FOUT: ${frion} <-> ${existing}: ${err.message}`)
      }
    }
  }
  console.log(`\n${count2} Frion-naar-bestaand afstanden berekend.\n`)

  // Stap 4: Opslaan
  writeFileSync(matrixPath, JSON.stringify(matrix, null, 2), 'utf-8')
  console.log('matrix_raw.json bijgewerkt.')

  // Stap 5: Regenereer matrix.js
  const lines = ['// Afstandsmatrix - afstanden in km tussen locaties']
  lines.push('// Gegenereerd uit Excel + gecorrigeerd met OSRM routeberekening')
  lines.push('// Inclusief Frion-locaties')
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
  console.log('matrix.js opnieuw gegenereerd.')

  const totalEntries = Object.keys(matrix).length
  console.log(`\nTotaal matrix entries: ${totalEntries}`)
  console.log('Klaar!')
}

main().catch(err => { console.error(err); process.exit(1) })
