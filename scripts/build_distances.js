/**
 * Build-script: Berekent ontbrekende/nul afstanden in de matrix via OpenRouteService API.
 *
 * Gebruik:
 *   node scripts/build_distances.js <ORS_API_KEY>
 *
 * Wat het doet:
 * 1. Leest alle locaties met hun adressen uit locations.js
 * 2. Geocodeert elk adres via ORS
 * 3. Berekent rijafstanden voor alle paren waar de huidige matrix 0 of ontbrekend is
 * 4. Update matrix_raw.json en genereert een nieuw matrix.js
 *
 * Let op: ORS heeft rate limits (gratis = 40 requests/min).
 * Het script pauzet automatisch om binnen de limits te blijven.
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const ORS_BASE = 'https://api.openrouteservice.org'
const API_KEY = process.argv[2]

if (!API_KEY) {
  console.error('Gebruik: node scripts/build_distances.js <ORS_API_KEY>')
  console.error('Maak een gratis key aan op https://openrouteservice.org/')
  process.exit(1)
}

// --- Locaties met adressen ---
const LOCATIONS = [
  // Hardenberg cluster
  { name: 'Keet', address: 'Vlasakkerkamp 19, 7772 MK Hardenberg' },
  { name: 'Hoogenweg', address: 'Hoogenweg 5, 7793 HN Hardenberg' },
  { name: 'Vlasakkerkamp', address: 'Vlasakkerkamp 2, 7772 MK Hardenberg' },
  { name: 'Spindel', address: 'Vlasakkerkamp 12b, 7772 MK Hardenberg' },
  { name: 'Oldenburg', address: 'Vlasakkerkamp 10, 7772 MK Hardenberg' },
  { name: 'Niehof', address: 'Vlasakkerkamp 14, 7772 MK Hardenberg' },
  { name: 'Holte', address: 'Vlasakkerkamp 15, 7772 MK Hardenberg' },
  { name: 'Baaldergroen', address: 'Roeterskamp 5, 7772 MC Hardenberg' },
  { name: 'Pijlkruid', address: 'Pijlkruid 2, 7772 NP Hardenberg' },
  { name: 'Hof van Pepijn', address: 'Pepijnpad 1, 7772 MR Hardenberg' },
  { name: 'Roots', address: 'Bruchterweg 180, 7772 BL Hardenberg' },
  { name: 'Koppeling', address: 'Molensteen 3, 7773 NM Hardenberg' },
  { name: 'Grasklokje 80', address: 'Grasklokje 80, 7772 NR Hardenberg' },
  { name: 'Grasklokje 45', address: 'Grasklokje 45, 7772 NR Hardenberg' },
  { name: 'Blanckvoortallee', address: 'Blanckvoortallee 8, 7773 AH Hardenberg' },
  { name: 'Wanne', address: 'Parkweg 3, 7772 XK Hardenberg' },
  { name: 'Gilde', address: 'Stationsstraat 1, 7772 AA Hardenberg' },
  { name: 'Ziekenhuis Hardenberg', address: 'Doctor Deelenlaan 5, 7772 BG Hardenberg' },

  // Ommen / Dedemsvaart cluster
  { name: 'Vlinder', address: 'Van Reeuwijkstraat 50, 7731 EH Ommen' },
  { name: 'De Elzenhoek', address: 'Van Reeuwijkstraat 50, 7731 EH Ommen' },
  { name: 'Hazelaar', address: 'Chevalleraustraat 60, 7731 DA Ommen' },
  { name: 'Linde', address: 'Chevalleraustraat 60, 7731 DA Ommen' },
  { name: 'Esrand', address: 'Chevalleraustraat 60, 7731 DA Ommen' },
  { name: 'Alteveer', address: 'Balkerweg 79, 7731 PJ Ommen' },
  { name: 'Hei en Dennen', address: 'Dante 55, 7731 JJ Ommen' },
  { name: 'Mulert', address: 'Mulertpad 10, 7731 PZ Ommen' },
  { name: 'Gerard Doustraat', address: 'Gerard Doustraat 2, 7731 KG Ommen' },
  { name: 'Dante', address: 'Dante 53, 7731 JJ Ommen' },
  { name: 'Van Dedem Marke', address: 'De Tjalk 49, 7701 LR Dedemsvaart' },

  // Nijverdal cluster
  { name: 'Nicolaas Beetsstraat', address: 'Nicolaas Beetsstraat 4, 7442 TL Nijverdal' },
  { name: 'Jeruzalemweg', address: 'Jeruzalemweg 36, 7443 TG Nijverdal' },
  { name: 'Ons Straatje', address: 'Jeruzalemweg 35, 7443 TG Nijverdal' },
  { name: 'Dahliastraat', address: 'Dahliastraat 2, 7442 LB Nijverdal' },

  // Rijssen cluster
  { name: 'Mauritshof', address: 'Zeven Peggenweg 9, 7461 VA Rijssen' },
  { name: 'Fluitekruid', address: 'Fluitekruid 4, 7463 EE Rijssen' },
  { name: 'Punt', address: 'H.J. van Opstallstraat 4, 7462 DM Rijssen' },

  // Overige Baalderborg locaties
  { name: 'Bremstraat', address: 'Bremstraat 2, 7676 BS Westerhaar' },
  { name: 'Spoort 12', address: 'Stationslaan 12, 7681 DL Vroomshoop' },
  { name: 'Koekange', address: 'Koekanger dwarsdijk 2, 7958 ST Koekange' },
  { name: 'Waal', address: 'Het Waal 214, 7823 NB Emmen' },
  { name: 'Tyehof', address: 'De Tye 1, 7683 AS Den Ham' },
  { name: 'Nieuwe Wever', address: 'Kalanderij 1, 7776 XW Slagharen' },
  { name: 'Muldershoek', address: 'Stationsweg 65, 7691 AP Bergentheim' },
  { name: 'Stegerveld', address: 'Coevorderweg 35e, 7737 PE Stegeren' },
  { name: 'Lutten', address: 'Gramsbergerweg 10, 7775 AB Lutten' },

  // Gedeelde locaties (Baalderborg + Frion)
  { name: 'Ijsselbolder', address: 'Commissarislaan 35, 8016 BE Zwolle' },
  { name: 'Erasmuslaan', address: 'Erasmuslaan 44, 8024 PT Zwolle' },
  { name: 'Frankhuizerallee', address: 'Frankhuizerallee 70, 8043 JG Zwolle' },
  { name: 'Govert Flinckstraat', address: 'Govert Flinckstraat 31, 8021 ET Zwolle' },
  { name: 'Frans Halsstraat', address: 'Frans Halsstraat 26, 8331 KG Steenwijk' },
  { name: 'Werkeren', address: 'Werkeren 1, 8024 AA Zwolle' },

  // Overig
  { name: 'Isala', address: 'Dr. Van Heesweg 2, 8025 AB Zwolle' },
  { name: "'s Heeren Loo Ermelo", address: 'Zandlaan 2, 3851 EH Ermelo' },

  // Frion-only locaties
  { name: 'Prunuspark', address: 'Prunuspark 35, 8024 AN Zwolle' },
  { name: 'Bachlaan', address: 'Bachlaan 4, 8031 HK Zwolle' },
  { name: 'Beulakerwiede', address: 'Beulakerwiede 25, 8032 DA Zwolle' },
  { name: 'Nicolaihof', address: 'Thorbeckegracht 42, 8011 WK Zwolle' },
  { name: 'Schumannlaan', address: 'Schumannlaan 2, 8031 JN Zwolle' },
  { name: 'Ternatestraat', address: 'Ternatestraat 7, 8022 BW Zwolle' },
  { name: 'Staatsmanlaan', address: 'Staatsmanlaan 131, 8032 CK Zwolle' },
  { name: 'Wismarstraat', address: 'Wismarstraat 2, 8017 EK Zwolle' },
  { name: 'De Stadshoeve', address: 'Schuurmanstraat 10, 8011 KG Zwolle' },
  { name: 'De Schellerhoeve', address: 'Schellerpad 2, 8017 AK Zwolle' },
  { name: 'Oldpark', address: 'Oldeneelallee 2, 8017 JN Zwolle' },
  { name: 'Anjelierstraat', address: 'Anjelierstraat 2, 8331 HM Steenwijk' },
  { name: 'Onnastraat', address: 'Onnastraat 2, 8331 HV Steenwijk' },
  { name: 'Van Goghstraat', address: 'Van Goghstraat 1, 8331 KJ Steenwijk' },
  { name: "'t Goor", address: "'t Goor 1, 8336 MG Baars" },
  { name: 'Dagcentrum De Slinger', address: 'Tukseweg 132, 8331 LH Steenwijk' },
]

// --- Helpers ---
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function geocode(address) {
  const url = `${ORS_BASE}/geocode/search?api_key=${API_KEY}&text=${encodeURIComponent(address)}&boundary.country=NL&size=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Geocode HTTP ${res.status}: ${await res.text()}`)
  const data = await res.json()
  if (!data.features?.length) throw new Error(`Adres niet gevonden: ${address}`)
  return data.features[0].geometry.coordinates // [lon, lat]
}

async function routeDistance(coordsFrom, coordsTo) {
  const res = await fetch(`${ORS_BASE}/v2/directions/driving-car`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': API_KEY },
    body: JSON.stringify({ coordinates: [coordsFrom, coordsTo] }),
  })
  if (!res.ok) throw new Error(`Route HTTP ${res.status}: ${await res.text()}`)
  const data = await res.json()
  if (!data.routes?.length) throw new Error('Geen route gevonden')
  return Math.round(data.routes[0].summary.distance / 1000) // km
}

// --- Main ---
async function main() {
  // Load existing matrix
  const matrixPath = join(ROOT, 'src/data/matrix_raw.json')
  const matrix = JSON.parse(readFileSync(matrixPath, 'utf-8'))

  // Step 1: Geocode all locations
  console.log(`\n=== Stap 1: ${LOCATIONS.length} locaties geocoderen ===\n`)
  const coords = {}
  let geocodeCount = 0

  for (const loc of LOCATIONS) {
    try {
      console.log(`  Geocoding: ${loc.name} (${loc.address})`)
      coords[loc.name] = await geocode(loc.address)
      console.log(`    -> [${coords[loc.name].join(', ')}]`)
      geocodeCount++
      // Rate limit: max 40/min for free tier, we do ~2/sec to be safe
      await sleep(1500)
    } catch (err) {
      console.error(`  FOUT bij ${loc.name}: ${err.message}`)
    }
  }

  console.log(`\n  ${geocodeCount}/${LOCATIONS.length} locaties succesvol gegeocodeerd.\n`)

  // Step 2: Find pairs that need distances calculated
  const pairs = []
  const locNames = LOCATIONS.map(l => l.name)

  for (let i = 0; i < locNames.length; i++) {
    for (let j = i + 1; j < locNames.length; j++) {
      const a = locNames[i]
      const b = locNames[j]
      if (!coords[a] || !coords[b]) continue

      const k1 = `${a}|${b}`
      const k2 = `${b}|${a}`
      const existing = matrix[k1] ?? matrix[k2]

      // Calculate if missing, 0, or same address but different location
      if (existing === undefined || existing === null || existing === 0) {
        // Skip if same exact address (distance would be 0)
        const locA = LOCATIONS.find(l => l.name === a)
        const locB = LOCATIONS.find(l => l.name === b)
        if (locA.address === locB.address) {
          // Same address = 0 km (e.g. Vlinder and De Elzenhoek)
          matrix[k1] = 0
          matrix[k2] = 0
          continue
        }
        pairs.push([a, b])
      }
    }
  }

  console.log(`=== Stap 2: ${pairs.length} afstanden berekenen ===\n`)

  let calcCount = 0
  let errorCount = 0

  for (const [a, b] of pairs) {
    try {
      const dist = await routeDistance(coords[a], coords[b])
      const k1 = `${a}|${b}`
      const k2 = `${b}|${a}`
      matrix[k1] = dist
      matrix[k2] = dist
      console.log(`  ${a} <-> ${b}: ${dist} km`)
      calcCount++
      // Rate limit for directions API
      await sleep(1500)
    } catch (err) {
      console.error(`  FOUT: ${a} <-> ${b}: ${err.message}`)
      errorCount++
      await sleep(2000)
    }
  }

  console.log(`\n  ${calcCount} afstanden berekend, ${errorCount} fouten.\n`)

  // Step 3: Save updated matrix
  writeFileSync(matrixPath, JSON.stringify(matrix, null, 2), 'utf-8')
  console.log('matrix_raw.json bijgewerkt.')

  // Step 4: Regenerate matrix.js
  const lines = ['// Afstandsmatrix - afstanden in km tussen locaties']
  lines.push('// Gegenereerd uit Excel + aangevuld met OpenRouteService')
  lines.push('// Key format: "Van|Naar" -> km')
  lines.push('')
  lines.push('const MATRIX_DATA = {')
  for (const key of Object.keys(matrix).sort()) {
    const [from, to] = key.split('|')
    lines.push(`  "${from}|${to}": ${matrix[key]},`)
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

  const matrixJsPath = join(ROOT, 'src/data/matrix.js')
  writeFileSync(matrixJsPath, lines.join('\n'), 'utf-8')
  console.log('matrix.js opnieuw gegenereerd.')

  // Summary
  const zeroCount = Object.values(matrix).filter(v => v === 0).length
  const totalEntries = Object.keys(matrix).length
  console.log(`\n=== Klaar! ===`)
  console.log(`Totaal entries: ${totalEntries}`)
  console.log(`Waarvan 0 km: ${zeroCount} (zelfde adres of zelfverwijzing)`)
  console.log(`\nJe kunt nu de dev server herstarten om de nieuwe afstanden te zien.`)
}

main().catch(err => {
  console.error('Onverwachte fout:', err)
  process.exit(1)
})
