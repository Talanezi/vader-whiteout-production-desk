// Reuse the accepted conservative detector and original production PDFs. Never
// substitute screenshots of a browser/quality gate for source artwork.
const fs = require('fs'),
  { execFileSync } = require('child_process'),
  ts = require('/tmp/m032/runtime/server/node_modules/typescript'),
  sharp = require('/tmp/m032/runtime/server/node_modules/sharp'),
  out = '/tmp/m05/refinement'
fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(
  out + '/detection.cjs',
  ts.transpileModule(
    fs.readFileSync('client/src/lib/storyboards/detection.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
)
const { suggestRegions } = require(out + '/detection.cjs')
;(async () => {
  for (const [label, file] of [
    ['scene09', 'Scene 09.pdf'],
    ['scene16', 'Scene16_Storyboard.pdf'],
  ]) {
    const prefix = out + '/' + label + '-source'
    execFileSync('pdftoppm', [
      '-f',
      '1',
      '-singlefile',
      '-scale-to',
      '2400',
      '-png',
      '/Users/thameralanezi/Downloads/' + file,
      prefix,
    ])
    const image = sharp(prefix + '.png'),
      meta = await image.metadata(),
      detect = await image
        .clone()
        .resize({ width: 1200, height: 1200, fit: 'inside' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
    const regions = suggestRegions({
      width: detect.info.width,
      height: detect.info.height,
      data: new Uint8ClampedArray(detect.data),
    })
    if (!regions.length)
      throw Error('Existing detector found no source frames.')
    for (let i = 0; i < Math.min(3, regions.length); i++) {
      const r = regions[i]
      await image
        .clone()
        .extract({
          left: Math.round(r.x * meta.width),
          top: Math.round(r.y * meta.height),
          width: Math.min(
            meta.width - Math.round(r.x * meta.width),
            Math.round(r.width * meta.width),
          ),
          height: Math.min(
            meta.height - Math.round(r.y * meta.height),
            Math.round(r.height * meta.height),
          ),
        })
        .png()
        .toFile(`${out}/${label}-art-${i + 1}.png`)
    }
    fs.writeFileSync(
      out + '/' + label + '-regions.json',
      JSON.stringify(regions),
    )
    console.log(
      label +
        ': ' +
        regions.length +
        ' existing frame suggestions; actual source artwork crops rendered.',
    )
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
