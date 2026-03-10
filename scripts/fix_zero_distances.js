/**
 * Fix 0-km afstanden in de matrix door echte rijafstanden te berekenen.
 * Gebruikt gratis APIs (geen key nodig):
 * - Nominatim (OpenStreetMap) voor geocoding
 * - OSRM voor routeberekening
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

// Alle locaties met adressen
const LOCATIONS = [
  // Hardenberg cluster
  { name: 'Keet', address: 'Vlasakkerkamp 19, Hardenberg, Netherlands' },
  { name: 'Hoogenweg', address: 'Hoogenweg 5, Hardenberg, Netherlands' },
  { name: 'Vlasakkerkamp', address: 'Vlasakkerkamp 2, Hardenberg, Netherlands' },
  { name: 'Spindel', address: 'Vlasakkerkamp 12b, Hardenberg, Netherlands' },
  { name: 'Oldenburg', address: 'Vlasakkerkamp 10, Hardenberg, Netherlands' },
  { name: 'Niehof', address: 'Vlasakkerkamp 14, Hardenberg, Netherlands' },
  { name: 'Holte', address: 'Vlasakkerkamp 15, Hardenberg, Netherlands' },
  { name: 'Baaldergroen', address: 'Roeterskamp 5, Hardenberg, Netherlands' },
  { name: 'Pijlkruid', address: 'Pijlkruid 2, Hardenberg, Netherlands' },
  { name: 'Hof van Pepijn', address: 'Pepijnpad 1, Hardenberg, Netherlands' },
  { name: 'Roots', address: 'Bruchterweg 180, Hardenberg, Netherlands' },
  { name: 'Koppeling', address: 'Molensteen 3, Hardenberg, Netherlands' },
  { name: 'Grasklokje 80', address: 'Grasklokje 80, Hardenberg, Netherlands' },
  { name: 'Grasklokje 45', address: 'Grasklokje 45, Hardenberg, Netherlands' },
  { name: 'Blanckvoortallee', address: 'Blanckvoortallee 8, Hardenberg, Netherlands' },
  { name: 'Wanne', address: 'Parkweg 3, Hardenberg, Netherlands' },
  { name: 'Gilde', address: 'Stationsstraat 1, Hardenberg, Netherlands' },
  { name: 'Ziekenhuis Hardenberg', address: 'Doctor Deelenlaan 5, Hardenberg, Netherlands' },

  // Ommen / Dedemsvaart cluster
  { name: 'Vlinder', address: 'Van Reeuwijkstraat 50, Ommen, Netherlands' },
  { name: 'De Elzenhoek', address: 'Van Reeuwijkstraat 50, Ommen, Netherlands' },
  { name: 'Hazelaar', address: 'Chevalleraustraat 60, Ommen, Netherlands' },
  { name: 'Linde', address: 'Chevalleraustraat 60, Ommen, Netherlands' },
  { name: 'Esrand', address: 'Chevalleraustraat 60, Ommen, Netherlands' },
  { name: 'Alteveer', address: 'Balkerweg 79, Ommen, Netherlands' },
  { name: 'Hei en Dennen', address: 'Dante 55, Ommen, Netherlands' },
  { name: 'Mulert', address: 'Mulertpad 10, Ommen, Netherlands' },
  { name: 'Gerard Doustraat', address: 'Gerard Doustraat 2, Ommen, Netherlands' },
  { name: 'Dante', address: 'Dante 53, Ommen, Netherlands' },
  { name: 'Van Dedem Marke', address: 'De Tjalk 49, Dedemsvaart, Netherlands' },

  // Nijverdal cluster
  { name: 'Nicolaas Beetsstraat', address: 'Nicolaas Beetsstraat 4, Nijverdal, Netherlands' },
  { name: 'Jeruzalemweg', address: 'Jeruzalemweg 36, Nijverdal, Netherlands' },
  { name: 'Ons Straatje', address: 'Jeruzalemweg 35, Nijverdal, Netherlands' },
  { name: 'Dahliastraat', address: 'Dahliastraat 2, Nijverdal, Netherlands' },

  // Rijssen cluster
  { name: 'Mauritshof', address: 'Zeven Peggenweg 9, Rijssen, Netherlands' },
  { name: 'Fluitekruid', address: 'Fluitekruid 4, Rijssen, Netherlands' },
  { name: 'Punt', address: 'H.J. van Opstallstraat 4, Rijssen, Netherlands' },

  // Overige
  { name: 'Bremstraat', address: 'Bremstraat 2, Westerhaar, Netherlands' },
  { name: 'Spoort 12', address: 'Stationslaan 12, Vroomshoop, Netherlands' },
  { name: 'Koekange', address: 'Koekanger dwarsdijk 2, Koekange, Netherlands' },
  { name: 'Waal', address: 'Het Waal 214, Emmen, Netherlands' },
  { name: 'Tyehof', address: 'De Tye 1, Den Ham, Netherlands' },
  { name: 'Nieuwe Wever', address: 'Kalanderij 1, Slagharen, Netherlands' },
  { name: 'Muldershoek', address: 'Stationsweg 65, Bergentheim, Netherlands' },
  { name: 'Stegerveld', address: 'Coevorderweg 35e, Stegeren, Netherlands' },
  { name: 'Lutten', address: 'Gramsbergerweg 10, Lutten, Netherlands' },

  // Gedeelde locaties
  { name: 'Ijsselbolder', address: 'Commissarislaan 35, Zwolle, Netherlands' },
  { name: 'Erasmuslaan', address: 'Erasmuslaan 44, Zwolle, Netherlands' },
  { name: 'Frankhuizerallee', address: 'Frankhuizerallee 70, Zwolle, Netherlands' },
  { name: 'Govert Flinckstraat', address: 'Govert Flinckstraat 31, Zwolle, Netherlands' },
  { name: 'Frans Halsstraat', address: 'Frans Halsstraat 26, Steenwijk, Netherlands' },
  { name: 'Werkeren', address: 'Werkeren 1, Zwolle, Netherlands' },
  { name: 'Isala', address: 'Dr. Van Heesweg 2, Zwolle, Netherlands' },
  { name: "'s Heeren Loo Ermelo", address: 'Zandlaan 2, Ermelo, Netherlands' },
]

// Adressen die identiek zijn -> 0 km is correct
const SAME_ADDRESS_GROUPS = [
  ['Vlinder', 'De Elzenhoek'],           // Van Reeuwijkstraat 50, Ommen
  ['Hazelaar', 'Linde', 'Esrand'],       // Chevalleraustraat 60, Ommen
  ['Dante', 'Hei en Dennen'],            // Dante 53/55 zijn direct naast elkaar
  ['Jeruzalemweg', 'Ons Straatje'],      // Jeruzalemweg 35/36 tegenover elkaar
]

function isSameAddressPair(a, b) {
  for (const group of SAME_ADDRESS_GROUPS) {
    if (group.includes(a) && group.includes(b)) return true
  }
  return false
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&countrycodes=nl&limit=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Rittenregistratie/1.0 (baalderborg-groep)' }
  })
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`)
  const data = await res.json()
  if (!data.length) throw new Error(`Niet gevonden: ${address}`)
  return { lon: parseFloat(data[0].lon), lat: parseFloat(data[0].lat) }
}

async function routeDistance(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`)
  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('Geen route')
  return Math.round(data.routes[0].distance / 1000) // meters -> km
}

async function main() {
  const matrixPath = join(ROOT, 'src/data/matrix_raw.json')
  const matrix = JSON.parse(readFileSync(matrixPath, 'utf-8'))

  // Stap 1: Vind alle 0-km paren (excl. zelfverwijzing)
  const zeroPairs = new Set()
  for (const [key, val] of Object.entries(matrix)) {
    if (val !== 0) continue
    const [a, b] = key.split('|')
    if (a === b) continue
    zeroPairs.add([a, b].sort().join('|'))
  }
  console.log(`Gevonden: ${zeroPairs.size} unieke paren met 0 km\n`)

  // Stap 2: Bepaal welke locaties we moeten geocoderen
  const neededNames = new Set()
  for (const pair of zeroPairs) {
    const [a, b] = pair.split('|')
    if (!isSameAddressPair(a, b)) {
      neededNames.add(a)
      neededNames.add(b)
    }
  }

  // Filter op locaties die we kennen
  const locMap = new Map(LOCATIONS.map(l => [l.name, l]))
  const toGeocode = [...neededNames].filter(n => locMap.has(n))
  console.log(`${toGeocode.length} locaties geocoderen...\n`)

  // Stap 3: Geocodeer
  const coords = {}
  let geocodeOk = 0
  let geocodeFail = 0

  for (const name of toGeocode) {
    const loc = locMap.get(name)
    try {
      coords[name] = await geocode(loc.address)
      console.log(`  OK: ${name} -> [${coords[name].lat}, ${coords[name].lon}]`)
      geocodeOk++
    } catch (err) {
      console.error(`  FOUT: ${name} (${loc.address}): ${err.message}`)
      geocodeFail++
    }
    await sleep(1100) // Nominatim rate limit: 1 req/sec
  }
  console.log(`\nGeocodeerd: ${geocodeOk} OK, ${geocodeFail} fouten\n`)

  // Stap 4: Bereken afstanden
  let calcOk = 0
  let calcFail = 0
  let keptZero = 0
  const updates = []

  for (const pair of zeroPairs) {
    const [a, b] = pair.split('|')

    // Zelfde adres? Dan 0 km houden
    if (isSameAddressPair(a, b)) {
      keptZero++
      continue
    }

    // Beide geocodeerd?
    if (!coords[a] || !coords[b]) {
      console.log(`  SKIP: ${a} <-> ${b} (niet geocodeerd)`)
      continue
    }

    try {
      const dist = await routeDistance(coords[a], coords[b])
      updates.push({ a, b, dist })
      console.log(`  ${a} <-> ${b}: ${dist} km`)
      calcOk++
      await sleep(200) // OSRM is minder streng
    } catch (err) {
      console.error(`  FOUT: ${a} <-> ${b}: ${err.message}`)
      calcFail++
      await sleep(500)
    }
  }

  console.log(`\nBerekend: ${calcOk} OK, ${calcFail} fouten, ${keptZero} gehouden als 0 km\n`)

  // Stap 5: Matrix updaten
  for (const { a, b, dist } of updates) {
    matrix[`${a}|${b}`] = dist
    matrix[`${b}|${a}`] = dist
  }

  writeFileSync(matrixPath, JSON.stringify(matrix, null, 2), 'utf-8')
  console.log('matrix_raw.json bijgewerkt.')

  // Stap 6: matrix.js regenereren
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
  console.log('matrix.js opnieuw gegenereerd.')

  // Summary
  const remaining = Object.entries(matrix).filter(([k, v]) => {
    const [a, b] = k.split('|')
    return v === 0 && a !== b
  }).length
  console.log(`\nResterend 0-km entries (zelfde adres): ${remaining}`)
  console.log('\nKlaar!')
}

main().catch(err => {
  console.error('Fout:', err)
  process.exit(1)
})
