import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const m = JSON.parse(readFileSync(join(__dirname, '..', 'src/data/matrix_raw.json'), 'utf-8'))

const entries = Object.entries(m)
const zeros = entries.filter(([k, v]) => {
  const [a, b] = k.split('|')
  return v === 0 && a !== b
})
const pairs = new Set()
zeros.forEach(([k]) => {
  const parts = k.split('|').sort()
  pairs.add(parts.join('|'))
})

console.log('Totaal entries:', entries.length)
console.log('Entries met 0 km (excl. zelfverwijzing):', zeros.length)
console.log('Unieke paren met 0 km:', pairs.size)
console.log('\nVoorbeeld paren:')
const arr = [...pairs].slice(0, 20)
arr.forEach(p => console.log(' ', p.replace('|', ' <-> ')))
