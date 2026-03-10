import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const matrixPath = join(ROOT, 'src/data/matrix_raw.json')
const raw = readFileSync(matrixPath, 'utf-8')

// Fix: "s Heeren Loo Ermelo" -> "'s Heeren Loo Ermelo"
const fixed = raw.replaceAll('s Heeren Loo Ermelo', "'s Heeren Loo Ermelo")
writeFileSync(matrixPath, fixed, 'utf-8')
console.log('Fixed apostrophe in matrix_raw.json')

// Regenerate matrix.js
const matrix = JSON.parse(fixed)
const lines = ['// Afstandsmatrix - afstanden in km tussen locaties']
lines.push('// Gegenereerd uit Excel + aangevuld')
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

writeFileSync(join(ROOT, 'src/data/matrix.js'), lines.join('\n'), 'utf-8')
console.log('Regenerated matrix.js')
