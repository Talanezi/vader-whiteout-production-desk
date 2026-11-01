/** Bound ZIP inflation before handing an XLSX to SheetJS. No archive entries are extracted. */
export function workbookInput(data: ArrayBuffer | Uint8Array): {
  data: Uint8Array | string
  type: 'array' | 'string'
} {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    let end = -1
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--)
      if (view.getUint32(i, true) === 0x06054b50) {
        end = i
        break
      }
    if (end < 0) throw Error('The XLSX archive is incomplete. Export it again.')
    const count = view.getUint16(end + 10, true),
      offset = view.getUint32(end + 16, true),
      size = view.getUint32(end + 12, true)
    if (
      count > 1500 ||
      offset + size > end ||
      count === 65535 ||
      offset === 0xffffffff
    )
      throw Error('The XLSX archive exceeds supported resource limits.')
    let cursor = offset,
      total = 0
    for (let i = 0; i < count; i++) {
      if (
        cursor + 46 > bytes.length ||
        view.getUint32(cursor, true) !== 0x02014b50
      )
        throw Error('The XLSX archive directory is invalid.')
      const flags = view.getUint16(cursor + 8, true),
        uncompressed = view.getUint32(cursor + 24, true)
      total += uncompressed
      if (flags & 1) throw Error('Use an unencrypted workbook.')
      if (uncompressed > 32 * 1024 * 1024 || total > 64 * 1024 * 1024)
        throw Error('The workbook expands beyond the 64 MB safety limit.')
      cursor +=
        46 +
        view.getUint16(cursor + 28, true) +
        view.getUint16(cursor + 30, true) +
        view.getUint16(cursor + 32, true)
      if (cursor > offset + size)
        throw Error('The XLSX archive directory is invalid.')
    }
    return { data: bytes, type: 'array' }
  }
  const encoding =
    bytes[0] === 0xff && bytes[1] === 0xfe
      ? 'utf-16le'
      : bytes[0] === 0xfe && bytes[1] === 0xff
        ? 'utf-16be'
        : 'utf-8'
  try {
    const text = new TextDecoder(encoding, { fatal: true }).decode(bytes)
    if (text.includes('\0')) throw Error()
    return { data: text, type: 'string' }
  } catch {
    throw Error(
      'Use an unencrypted XLSX workbook or a UTF-8 / UTF-16 CSV or TSV export.',
    )
  }
}
