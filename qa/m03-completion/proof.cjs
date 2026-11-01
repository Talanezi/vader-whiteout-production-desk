/* Local-only Scene 05 geometry proof; no API calls or application mutations. */
const fs = require('node:fs'),
  path = require('node:path')
const {
  PDFDocument,
  rgb,
} = require('/tmp/m03-completion/pdf-runtime/node_modules/pdf-lib')
const fontkit = require('/tmp/m03-completion/pdf-runtime/node_modules/@pdf-lib/fontkit')
const XLSX = require('/tmp/m032/runtime/client/node_modules/xlsx')
;(async () => {
  const workbook = XLSX.readFile(
    process.env.M03_WORKBOOK ||
      '/Users/thameralanezi/Downloads/Shot List - Vader_ Whiteout.xlsx',
  )
  const data = XLSX.utils.sheet_to_json(
    workbook.Sheets['Shot List - Scene 05'],
    { header: 1, defval: '' },
  )
  const rows = data.slice(4, 18),
    headers = data[3].slice(0, 19)
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const file = path.resolve(
    __dirname,
    '../../server/assets/fonts/DejaVuSans.ttf',
  )
  const font = await pdf.embedFont(fs.readFileSync(file), { subset: true })
  const page = pdf.addPage([792, 612]),
    size = 4.2,
    pad = 1.5,
    leading = 5.1
  const edges = [
    33.5, 47, 70, 101, 141, 181, 221, 261, 309, 349, 397, 445, 480, 515, 550,
    581, 605, 637, 697, 758.5,
  ]
  function wrap(value, width) {
    const lines = []
    for (const para of String(value).split('\n')) {
      let line = ''
      for (const word of para.split(/\s+/)) {
        const trial = line ? line + ' ' + word : word
        if (font.widthOfTextAtSize(trial, size) <= width) {
          line = trial
          continue
        }
        if (line) lines.push(line)
        line = ''
        for (const ch of word) {
          if (line && font.widthOfTextAtSize(line + ch, size) > width) {
            lines.push(line)
            line = ''
          }
          line += ch
        }
      }
      lines.push(line)
    }
    return lines
  }
  let y = 567
  page.drawText('WHITEOUT / PRODUCTION DESK', {
    x: 33.5,
    y: 593,
    size: 7,
    font,
  })
  page.drawText('SCENE 05 · Foresty stuffs · Outdoors / Afternoon', {
    x: 33.5,
    y: 579,
    size: 6,
    font,
  })
  const measurements = []
  for (const [ri, row] of [headers, ...rows].entries()) {
    const cells = headers.map((_, i) =>
      wrap(row[i] ?? '', edges[i + 1] - edges[i] - pad * 2),
    )
    const height = Math.max(
      ri ? 15 : 22,
      ...cells.map((x) => x.length * leading + pad * 2),
    )
    if (y - height < 25)
      throw Error('Proof exceeds one page; solve geometry before integration')
    for (let c = 0; c < cells.length; c++) {
      const x = edges[c],
        width = edges[c + 1] - x
      page.drawRectangle({
        x,
        y: y - height,
        width,
        height,
        borderWidth: 0.25,
        borderColor: rgb(0.72, 0.74, 0.76),
        color: ri ? rgb(1, 1, 1) : rgb(0.86, 0.87, 0.88),
      })
      cells[c].forEach((line, i) =>
        page.drawText(line, {
          x: x + pad,
          y: y - pad - size - i * leading,
          size,
          font,
          color: rgb(0.04, 0.05, 0.06),
        }),
      )
    }
    measurements.push({ row: ri, height, lines: cells.map((x) => x.length) })
    y -= height
  }
  page.drawText('Total scene time: 187 min / 3.12 hours', {
    x: 33.5,
    y: y - 13,
    size: 6,
    font,
  })
  page.drawText('1 / 1', { x: 746, y: 15, size: 5, font })
  fs.writeFileSync('/tmp/m03-completion/scene05-proof.pdf', await pdf.save())
  fs.writeFileSync(
    '/tmp/m03-completion/measurement.json',
    JSON.stringify(
      {
        pages: 1,
        shots: rows.length,
        columns: 19,
        technicalFields: 17,
        font: 'DejaVu Sans',
        fontPt: size,
        widths: edges.slice(1).map((x, i) => x - edges[i]),
        measurements,
        bottom: y,
      },
      null,
      2,
    ),
  )
  console.log(
    'Scene 05 proof: 14 complete shots, 19 source columns (17 named technical fields), one Letter-landscape page; bottom',
    y,
  )
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
