const { runtime, out, api } = require('../m032/helpers.cjs'),
  fs = require('fs'),
  path = require('path'),
  { execFileSync } = require('child_process')
;(async () => {
  const list = (await api('')).items.find((i) =>
      i.name.startsWith('Final M03'),
    ),
    data = await api('/' + list.id + '/export'),
    ids = Object.values(data.shots)
      .sort((a, b) => a.number.localeCompare(b.number))
      .map((s) => ({ shotId: s.id })),
    { buildTablePrint, printFields } = require(
      path.join(runtime, 'server-dist/shotlists/pdf/table-print'),
    ),
    { compileShotlist } = require(
      path.join(runtime, 'server-dist/shotlists/pdf/compile-shotlist'),
    ),
    Printer = require('/tmp/m03-final-pdf-comparison/node_modules/pdfmake'),
    font = execFileSync('/Library/TeX/texbin/kpsewhich', ['DejaVuSans.ttf'])
      .toString()
      .trim(),
    printer = new Printer({
      DejaVu: {
        normal: font,
        bold: font.replace('DejaVuSans.ttf', 'DejaVuSans-Bold.ttf'),
        italics: font,
        bolditalics: font,
      },
    }),
    dest = path.join(out, 'final')
  fs.mkdirSync(dest, { recursive: true })
  const results = []
  for (const count of [10, 25]) {
    const rows = ids.slice(0, count),
      columns = Object.keys(printFields)
        .filter(
          (f) =>
            ![
              'sequence',
              'assignmentNotes',
              'assignmentStatus',
              'scene',
            ].includes(f),
        )
        .map((field) => ({ field, width: field === 'coverage' ? 330 : 120 })),
      spec = {
        version: 2,
        scope: 'entire',
        layout: 'expanded',
        rows,
        columns,
        paper: 'letter',
        orientation: 'landscape',
        margins: 'normal',
        scaling: 'fit-width',
        text: 'wrap',
        groupScenes: true,
      }
    let t = Date.now()
    const bytes = await compileShotlist(buildTablePrint(data, spec).source),
      file = path.join(dest, `xelatex-${count}-technical.pdf`)
    fs.writeFileSync(file, bytes)
    results.push({
      engine: 'XeLaTeX',
      count,
      ms: Date.now() - t,
      pages: Number(
        execFileSync('pdfinfo', [file])
          .toString()
          .match(/Pages:\s+(\d+)/)[1],
      ),
    })
    t = Date.now()
    const body = [
      [
        { text: 'Shot', bold: true },
        { text: 'Selected technical fields', bold: true },
      ],
      ...rows.map((r) => {
        const s = data.shots[r.shotId]
        return [
          s.number,
          columns
            .filter((c) => c.field !== 'number')
            .map((c) => `${printFields[c.field]}: ${s[c.field] || '—'}`)
            .join('\n'),
        ]
      }),
    ]
    const pdf = printer.createPdfKitDocument({
      pageSize: 'LETTER',
      pageOrientation: 'landscape',
      pageMargins: [34, 34, 34, 34],
      defaultStyle: { font: 'DejaVu', fontSize: 9 },
      content: [
        {
          table: { headerRows: 1, widths: [70, '*'], body },
          layout: 'lightHorizontalLines',
        },
      ],
    })
    const chunks = []
    await new Promise((resolve, reject) => {
      pdf.on('data', (b) => chunks.push(b))
      pdf.on('end', resolve)
      pdf.on('error', reject)
      pdf.end()
    })
    const other = path.join(dest, `pdfmake-${count}-technical.pdf`)
    fs.writeFileSync(other, Buffer.concat(chunks))
    results.push({
      engine: 'pdfmake 0.2.20',
      count,
      ms: Date.now() - t,
      pages: Number(
        execFileSync('pdfinfo', [other])
          .toString()
          .match(/Pages:\s+(\d+)/)[1],
      ),
    })
  }
  fs.writeFileSync(
    path.join(dest, 'renderer-comparison.json'),
    JSON.stringify(results, null, 2),
  )
  console.log(results)
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
