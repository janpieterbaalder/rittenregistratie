import json

with open('src/data/matrix_raw.json') as f:
    matrix = json.load(f)

lines = ['// Afstandsmatrix - afstanden in km tussen locaties']
lines.append('// Gegenereerd uit Excel + aangevuld')
lines.append('// Key format: "Van|Naar" -> km')
lines.append('')
lines.append('const MATRIX_DATA = {')
for key, val in sorted(matrix.items()):
    from_loc, to_loc = key.split('|')
    lines.append(f'  "{from_loc}|{to_loc}": {val},')
lines.append('}')
lines.append('')
lines.append('export function getDistance(from, to) {')
lines.append('  if (from === to) return 0')
lines.append('  const key1 = `${from}|${to}`')
lines.append('  const key2 = `${to}|${from}`')
lines.append('  if (MATRIX_DATA[key1] !== undefined) return MATRIX_DATA[key1]')
lines.append('  if (MATRIX_DATA[key2] !== undefined) return MATRIX_DATA[key2]')
lines.append('  return null')
lines.append('}')
lines.append('')
lines.append('export function getAllLocationNames() {')
lines.append('  const names = new Set()')
lines.append('  for (const key of Object.keys(MATRIX_DATA)) {')
lines.append('    const [from, to] = key.split("|")')
lines.append('    names.add(from)')
lines.append('    names.add(to)')
lines.append('  }')
lines.append('  return [...names].sort()')
lines.append('}')

with open('src/data/matrix.js', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f'Generated matrix.js with {len(matrix)} entries')
