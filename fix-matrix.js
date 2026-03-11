/**
 * Fix Matrix Script
 *
 * Herberekent ALLE afstanden in de matrix via OSRM routeberekening.
 * Vervangt de waarden in matrix.js met correcte waarden.
 *
 * Gebruik:
 *   node fix-matrix.js                  -> start/hervat herberekening
 *   node fix-matrix.js --status         -> toon voortgang
 *   node fix-matrix.js --reset          -> begin opnieuw (wist voortgang)
 *   node fix-matrix.js --reset-geo      -> wis geocache (forceer opnieuw geocoderen)
 *   node fix-matrix.js --write          -> schrijf resultaten naar matrix.js
 *   node fix-matrix.js --diff           -> toon alle veranderingen t.o.v. huidige matrix
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ==========================================
// Config
// ==========================================
const BATCH_SIZE = 50           // Paren per batch
const NOMINATIM_DELAY = 1100    // ms tussen Nominatim requests
const OSRM_DELAY = 250          // ms tussen OSRM requests (iets ruimer)
const MAX_RETRIES = 2           // Retries bij OSRM fout

const GEO_CACHE_FILE = join(__dirname, 'fix-geocache.json')
const PROGRESS_FILE = join(__dirname, 'fix-progress.json')

// ==========================================
// Laad locaties uit bronbestand
// ==========================================
function loadLocations() {
  const src = readFileSync(join(__dirname, 'src/data/locations.js'), 'utf-8')
  const match = src.match(/export const LOCATIONS = (\[[\s\S]*?\n\])/m)
  if (!match) throw new Error('Kan LOCATIONS niet parsen')
  return eval(match[1])
}

function loadCurrentMatrix() {
  const src = readFileSync(join(__dirname, 'src/data/matrix.js'), 'utf-8')
  const match = src.match(/const MATRIX_DATA = (\{[\s\S]*?\n\})/)
  if (!match) throw new Error('Kan MATRIX_DATA niet parsen')
  return eval(`(${match[1]})`)
}

// ==========================================
// JSON helpers
// ==========================================
function loadJSON(file, fallback) {
  if (!existsSync(file)) return fallback
  return JSON.parse(readFileSync(file, 'utf-8'))
}

function saveJSON(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2))
}

// ==========================================
// Nominatim geocoding (rate limited)
// ==========================================
let lastNominatimCall = 0

async function nominatimSearch(query) {
  const now = Date.now()
  const wait = Math.max(0, NOMINATIM_DELAY - (now - lastNominatimCall))
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastNominatimCall = Date.now()

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=nl&limit=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Rittenregistratie-FixMatrix/1.0 (baalderborg-groep)' }
  })
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)
  return res.json()
}

async function geocodeLocation(loc, cache) {
  if (cache.coords[loc.name]) return cache.coords[loc.name]

  const queries = []
  if (loc.address && loc.city) queries.push(`${loc.address}, ${loc.city}, Netherlands`)
  if (loc.address && loc.postcode) queries.push(`${loc.address}, ${loc.postcode} ${loc.city || ''}, Netherlands`)
  if (loc.postcode && loc.city) queries.push(`${loc.postcode}, ${loc.city}, Netherlands`)

  for (const query of queries) {
    try {
      const data = await nominatimSearch(query)
      if (data.length) {
        const coords = { lon: parseFloat(data[0].lon), lat: parseFloat(data[0].lat) }
        // Sanity check: moet in Nederland zijn (lon 3.3-7.2, lat 50.7-53.5)
        if (coords.lon < 3.3 || coords.lon > 7.2 || coords.lat < 50.7 || coords.lat > 53.6) {
          console.log(`    WAARSCHUWING: "${query}" gaf coords buiten NL: ${coords.lat}, ${coords.lon}`)
          continue
        }
        // Extra check: als city Hardenberg is, moet lon ~6.5-6.8 en lat ~52.5-52.6 zijn
        if (loc.city === 'Hardenberg' && (coords.lon < 6.4 || coords.lon > 6.8 || coords.lat < 52.5 || coords.lat > 52.65)) {
          console.log(`    WAARSCHUWING: "${query}" gaf coords ver van Hardenberg: ${coords.lat}, ${coords.lon}`)
          continue
        }
        cache.coords[loc.name] = coords
        saveJSON(GEO_CACHE_FILE, cache)
        return coords
      }
    } catch (err) {
      console.error(`  Geocode fout voor "${query}": ${err.message}`)
    }
  }

  console.log(`  NIET GEVONDEN: ${loc.name}`)
  cache.failed.push(loc.name)
  saveJSON(GEO_CACHE_FILE, cache)
  return null
}

// ==========================================
// OSRM route distance (met retry)
// ==========================================
async function osrmDistance(fromCoords, toCoords, retries = 0) {
  await new Promise(r => setTimeout(r, OSRM_DELAY))
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromCoords.lon},${fromCoords.lat};${toCoords.lon},${toCoords.lat}?overview=false`
    const res = await fetch(url)
    const data = await res.json()
    if (data.code !== 'Ok') {
      if (retries < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000))
        return osrmDistance(fromCoords, toCoords, retries + 1)
      }
      return null
    }
    return Math.round(data.routes[0].distance / 1000)
  } catch (err) {
    if (retries < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, 2000))
      return osrmDistance(fromCoords, toCoords, retries + 1)
    }
    return null
  }
}

// ==========================================
// Stap 1: Geocodeer alle locaties
// ==========================================
async function geocodeAll(locations, cache) {
  const toGeocode = locations.filter(l => !cache.coords[l.name] && !cache.failed.includes(l.name))

  if (!toGeocode.length) {
    console.log(`Alle ${Object.keys(cache.coords).length} locaties zijn gegeocodeerd.`)
    if (cache.failed.length) {
      console.log(`  ${cache.failed.length} mislukt: ${cache.failed.join(', ')}`)
    }
    return
  }

  console.log(`Geocoderen van ${toGeocode.length} locaties...`)
  for (let i = 0; i < toGeocode.length; i++) {
    const loc = toGeocode[i]
    process.stdout.write(`  [${i + 1}/${toGeocode.length}] ${loc.name}... `)
    const coords = await geocodeLocation(loc, cache)
    if (coords) {
      console.log(`OK (${coords.lat}, ${coords.lon})`)
    } else {
      console.log('NIET GEVONDEN')
    }
  }
  console.log(`Geocoderen klaar. ${Object.keys(cache.coords).length} locaties met coordinaten.`)
}

// ==========================================
// Stap 2: Bereken afstanden in batches
// ==========================================
async function calculateBatch(locations, cache, progress) {
  // Bouw alle unieke paren
  const allPairs = []
  for (let i = 0; i < locations.length; i++) {
    for (let j = i + 1; j < locations.length; j++) {
      const a = locations[i].name
      const b = locations[j].name
      const key = [a, b].sort().join('|')
      allPairs.push({ from: a, to: b, key })
    }
  }

  // Filter al berekende paren
  const doneKeys = new Set(Object.keys(progress.distances))
  const remaining = allPairs.filter(p => !doneKeys.has(p.key))

  if (!remaining.length) {
    console.log('Alle paren zijn berekend!')
    return true
  }

  const totalDone = Object.keys(progress.distances).length
  console.log(`\nVoortgang: ${totalDone}/${allPairs.length} paren berekend`)
  console.log(`Deze batch: ${Math.min(BATCH_SIZE, remaining.length)} paren\n`)

  const batch = remaining.slice(0, BATCH_SIZE)
  let ok = 0, skip = 0, err = 0

  for (let i = 0; i < batch.length; i++) {
    const { from, to, key } = batch[i]
    process.stdout.write(`  [${totalDone + i + 1}/${allPairs.length}] ${from} -> ${to}... `)

    const fromCoords = cache.coords[from]
    const toCoords = cache.coords[to]

    if (!fromCoords || !toCoords) {
      console.log('OVERGESLAGEN (geen coords)')
      progress.skipped.push(key)
      skip++
      continue
    }

    const km = await osrmDistance(fromCoords, toCoords)
    if (km === null) {
      console.log('OSRM FOUT')
      progress.errors.push(key)
      err++
    } else {
      console.log(`${km} km`)
      progress.distances[key] = km
      ok++
    }

    // Sla voortgang op na elke berekening
    if ((i + 1) % 10 === 0 || i === batch.length - 1) {
      saveJSON(PROGRESS_FILE, progress)
    }
  }

  saveJSON(PROGRESS_FILE, progress)

  const newTotal = Object.keys(progress.distances).length
  const pct = ((newTotal / allPairs.length) * 100).toFixed(1)
  console.log(`\n--- Batch klaar ---`)
  console.log(`  OK: ${ok}  |  Overgeslagen: ${skip}  |  Fouten: ${err}`)
  console.log(`  Totaal: ${newTotal}/${allPairs.length} (${pct}%)`)

  if (newTotal < allPairs.length) {
    console.log(`\nNog ${allPairs.length - newTotal} paren te berekenen.`)
    console.log(`Voer het script nogmaals uit om verder te gaan.`)
  }

  return newTotal >= allPairs.length
}

// ==========================================
// Status tonen
// ==========================================
function showStatus(locations, progress) {
  const totalPairs = (locations.length * (locations.length - 1)) / 2
  const done = Object.keys(progress.distances).length
  const pct = ((done / totalPairs) * 100).toFixed(1)

  console.log('\n========================================')
  console.log('  FIX MATRIX - STATUS')
  console.log('========================================\n')
  console.log(`Locaties:      ${locations.length}`)
  console.log(`Totale paren:  ${totalPairs}`)
  console.log(`Berekend:      ${done} (${pct}%)`)
  console.log(`Overgeslagen:  ${progress.skipped.length}`)
  console.log(`Fouten:        ${progress.errors.length}`)
  console.log(`Nog te doen:   ${totalPairs - done - progress.skipped.length - progress.errors.length}`)
}

// ==========================================
// Diff tonen
// ==========================================
function showDiff(progress) {
  const currentMatrix = loadCurrentMatrix()
  const changes = []

  for (const [key, newKm] of Object.entries(progress.distances)) {
    const [a, b] = key.split('|')
    // Check beide richtingen in huidige matrix
    const k1 = `${a}|${b}`
    const k2 = `${b}|${a}`
    const oldKm = currentMatrix[k1] ?? currentMatrix[k2] ?? null

    if (oldKm === null) {
      changes.push({ from: a, to: b, old: 'NIEUW', new: newKm, diff: 'nieuw' })
    } else if (oldKm !== newKm) {
      changes.push({ from: a, to: b, old: oldKm, new: newKm, diff: newKm - oldKm })
    }
  }

  if (!changes.length) {
    console.log('Geen veranderingen gevonden.')
    return
  }

  // Sorteer op absolute afwijking
  changes.sort((a, b) => {
    if (typeof a.diff === 'string') return 1
    if (typeof b.diff === 'string') return -1
    return Math.abs(b.diff) - Math.abs(a.diff)
  })

  console.log(`\n${changes.length} veranderingen gevonden:\n`)
  console.log('Van | Naar | Oud | Nieuw | Verschil')
  console.log('-'.repeat(65))
  for (const c of changes) {
    const diffStr = typeof c.diff === 'string' ? c.diff : `${c.diff > 0 ? '+' : ''}${c.diff} km`
    console.log(`${c.from} | ${c.to} | ${c.old} km | ${c.new} km | ${diffStr}`)
  }
}

// ==========================================
// Matrix.js herschrijven
// ==========================================
function writeMatrix(locations, progress) {
  const currentMatrix = loadCurrentMatrix()

  // Bouw nieuwe matrix met OSRM-waarden, beide richtingen
  const newMatrix = {}

  for (const [key, km] of Object.entries(progress.distances)) {
    const [a, b] = key.split('|')
    newMatrix[`${a}|${b}`] = km
    newMatrix[`${b}|${a}`] = km
  }

  // Voeg ook bestaande entries toe die niet herberekend zijn (bv. door skipped/errors)
  for (const [key, km] of Object.entries(currentMatrix)) {
    if (!newMatrix[key]) {
      newMatrix[key] = km
    }
  }

  // Sorteer keys
  const sortedKeys = Object.keys(newMatrix).sort()

  // Schrijf matrix.js
  let content = `// Afstandsmatrix - afstanden in km tussen locaties
// Herberekend met OSRM routeberekening op ${new Date().toISOString().split('T')[0]}
// Key format: "Van|Naar" -> km

const MATRIX_DATA = {\n`

  for (const key of sortedKeys) {
    content += `  "${key}": ${newMatrix[key]},\n`
  }

  content += `}

export function getDistance(from, to) {
  const key = \`\${from}|\${to}\`
  if (MATRIX_DATA[key] !== undefined) return MATRIX_DATA[key]
  const reverseKey = \`\${to}|\${from}\`
  if (MATRIX_DATA[reverseKey] !== undefined) return MATRIX_DATA[reverseKey]
  return null
}
`

  const matrixPath = join(__dirname, 'src/data/matrix.js')
  writeFileSync(matrixPath, content)

  const entryCount = sortedKeys.length
  const uniquePairs = Object.keys(progress.distances).length
  console.log(`\nmatrix.js herschreven: ${entryCount} entries (${uniquePairs} unieke paren, beide richtingen)`)
}

// ==========================================
// Main
// ==========================================
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--reset')) {
    if (existsSync(PROGRESS_FILE)) writeFileSync(PROGRESS_FILE, '{}')
    console.log('Voortgang gereset.')
    return
  }

  if (args.includes('--reset-geo')) {
    if (existsSync(GEO_CACHE_FILE)) writeFileSync(GEO_CACHE_FILE, '{}')
    console.log('Geocache gereset.')
    return
  }

  const locations = loadLocations()

  if (args.includes('--status')) {
    const progress = loadJSON(PROGRESS_FILE, { distances: {}, skipped: [], errors: [] })
    showStatus(locations, progress)
    return
  }

  if (args.includes('--diff')) {
    const progress = loadJSON(PROGRESS_FILE, { distances: {}, skipped: [], errors: [] })
    showDiff(progress)
    return
  }

  if (args.includes('--write')) {
    const progress = loadJSON(PROGRESS_FILE, { distances: {}, skipped: [], errors: [] })
    if (!Object.keys(progress.distances).length) {
      console.log('Geen berekende afstanden gevonden. Voer eerst het script uit zonder --write.')
      return
    }
    writeMatrix(locations, progress)
    return
  }

  console.log('Fix Matrix Script')
  console.log('=================\n')
  console.log(`${locations.length} locaties gevonden`)

  // Stap 1: Geocoderen
  const cache = loadJSON(GEO_CACHE_FILE, { coords: {}, failed: [] })
  await geocodeAll(locations, cache)

  // Stap 2: Bereken afstanden
  const progress = loadJSON(PROGRESS_FILE, { distances: {}, skipped: [], errors: [] })
  const done = await calculateBatch(locations, cache, progress)

  if (done) {
    console.log('\n\nAlle afstanden berekend!')
    console.log('Gebruik `node fix-matrix.js --diff` om de veranderingen te zien.')
    console.log('Gebruik `node fix-matrix.js --write` om matrix.js te herschrijven.')
  }
}

main().catch(err => {
  console.error('Fatale fout:', err)
  process.exit(1)
})
