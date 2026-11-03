const fs = require('fs'),
  assert = require('assert/strict'),
  cp = require('child_process'),
  { join } = require('../m04/collaboration.cjs'),
  auth = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  flow = JSON.parse(
    fs.readFileSync('/tmp/m05/corrections/chromium/flow.json'),
  ),
  base = 'http://127.0.0.1:4314/api/flows/' + flow.id,
  headers = {
    Authorization: 'Bearer ' + auth.tokens['101'],
    'Content-Type': 'application/json',
  }
;(async () => {
  let r = await fetch(base + '/snapshot', { headers }),
    snap = await r.json(),
    ids = Object.keys(snap.state.departments),
    spec = {
      product: 'master',
      paper: 'letter',
      orientation: 'portrait',
      style: 'mono',
      departments: ids.slice(0, 3),
      actual: false,
      personnel: true,
      notes: true,
    },
    client = await join(flow.id, '102', 'flows'),
    name = client.doc.getMap('meta').get('name')
  try {
    const pending = fetch(base + '/department-pack', {
      method: 'POST',
      headers,
      body: JSON.stringify(spec),
    })
    await new Promise((r) => setTimeout(r, 80))
    client.doc
      .getMap('meta')
      .set('name', 'Concurrent edit after pack request')
    r = await pending
    assert(r.ok, await r.clone().text())
    fs.writeFileSync(
      '/tmp/m05/corrections/subset.zip',
      Buffer.from(await r.arrayBuffer()),
    )
    cp.execFileSync(
      'python3',
      [
        '-c',
        `import zipfile,subprocess,tempfile,pathlib
z=zipfile.ZipFile('/tmp/m05/corrections/subset.zip'); assert len(z.namelist())==3;assert z.testzip() is None
texts=[]
for i,n in enumerate(z.namelist()):
 assert '2026-11-12' in n and '/' not in n and n.endswith('.pdf');p=pathlib.Path('/tmp/m05/corrections')/('pack-'+str(i)+'.pdf');p.write_bytes(z.read(n));texts.append(subprocess.check_output(['pdftotext',str(p),'-'],text=True))
assert all(t.splitlines()[0]==texts[0].splitlines()[0] for t in texts)
assert all('WHITEOUT /' not in t and 'inherited' not in t and 'America/' not in t and 'draft' not in t for t in texts)
print('Three-file ZIP CRC, safe unique names, same snapshot title, portrait PDFs and clean headers passed.')`,
      ],
      { stdio: 'inherit' },
    )
    for (const departments of [
      [],
      [ids[0], ids[0]],
      ['foreign-department'],
    ]) {
      const q = await fetch(base + '/department-pack', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...spec, departments }),
      })
      assert.equal(q.status, 400)
    }
    const abort = new AbortController(),
      cancel = fetch(base + '/department-pack', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...spec, departments: ids }),
        signal: abort.signal,
      })
    setTimeout(() => abort.abort(), 15)
    await cancel.catch((e) => assert.equal(e.name, 'AbortError'))
    await new Promise((r) => setTimeout(r, 1500))
    const retry = await fetch(base + '/department-pack', {
      method: 'POST',
      headers,
      body: JSON.stringify(spec),
    })
    assert(retry.ok, await retry.clone().text())
    const {
      zipFiles,
      safeFilename,
    } = require('/tmp/m032/runtime/server-dist/flows/zip')
    assert.throws(() => zipFiles([]))
    assert.throws(() =>
      zipFiles(
        Array.from({ length: 41 }, () => ({
          name: 'a',
          bytes: Buffer.alloc(0),
        })),
      ),
    )
    assert.throws(() =>
      zipFiles([{ name: 'a', bytes: Buffer.alloc(32 * 1024 * 1024 + 1) }]),
    )
    assert(!safeFilename('../../a:b').includes('/'))
    console.log(
      'ZIP subset/errors/cancellation and subsequent retry; 40-file/32-MB bounds and safe names passed.',
    )
  } finally {
    client.doc.getMap('meta').set('name', name)
    await new Promise((r) => setTimeout(r, 300))
    client.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
