import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const m = JSON.parse(readFileSync(join(__dirname, '..', 'src/data/matrix_raw.json'), 'utf-8'))

// Verzamel alle locatienamen
const names = new Set()
for (const key of Object.keys(m)) {
  const [a, b] = key.split('|')
  names.add(a)
  names.add(b)
}
const sorted = [...names].sort()

console.log(`=== LOCATIES IN DE MATRIX (${sorted.length}) ===\n`)
sorted.forEach((n, i) => console.log(`${String(i + 1).padStart(3)}. ${n}`))

// Check completeness
const total = sorted.length
const expectedPairs = total * (total - 1) // A->B en B->A
const actualPairs = Object.keys(m).filter(k => { const [a,b] = k.split('|'); return a !== b }).length
const missingPairs = []

for (let i = 0; i < sorted.length; i++) {
  for (let j = 0; j < sorted.length; j++) {
    if (i === j) continue
    const key = `${sorted[i]}|${sorted[j]}`
    if (m[key] === undefined || m[key] === null) {
      missingPairs.push(key)
    }
  }
}

console.log(`\n=== MATRIX VOLLEDIGHEID ===`)
console.log(`Locaties: ${total}`)
console.log(`Verwacht paren (excl. zelf): ${expectedPairs}`)
console.log(`Aanwezig: ${actualPairs}`)
console.log(`Ontbrekend: ${missingPairs.length}`)
console.log(`Volledigheid: ${((actualPairs / expectedPairs) * 100).toFixed(1)}%`)

// Toon welke locaties ontbrekende paren hebben
if (missingPairs.length > 0) {
  const missingByLoc = {}
  for (const p of missingPairs) {
    const [a, b] = p.split('|')
    if (!missingByLoc[a]) missingByLoc[a] = []
    missingByLoc[a].push(b)
  }

  console.log(`\n=== ONTBREKENDE PAREN PER LOCATIE ===\n`)
  for (const loc of Object.keys(missingByLoc).sort()) {
    const missing = missingByLoc[loc]
    console.log(`${loc} (${missing.length} ontbrekend):`)
    console.log(`  ${missing.join(', ')}`)
  }
}

// Toon 0-km entries (niet-zelf)
const zeroEntries = Object.entries(m).filter(([k, v]) => {
  const [a, b] = k.split('|')
  return v === 0 && a !== b
})
const zeroPairs = new Set()
zeroEntries.forEach(([k]) => {
  const parts = k.split('|').sort()
  zeroPairs.add(parts.join(' <-> '))
})
console.log(`\n=== 0-KM PAREN (${zeroPairs.size} uniek) ===`)
console.log(`Dit zijn locaties op hetzelfde adres of < 1 km afstand:\n`)
for (const p of [...zeroPairs].sort()) {
  console.log(`  ${p}`)
}
