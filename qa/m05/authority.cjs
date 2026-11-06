// Isolated loopback QA authority. Uses the real Scheduler membership verifier.
const fs = require('node:fs'),
  http = require('node:http'),
  s = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  {
    verifiedMembership,
  } = require('/tmp/whiteout-membership-scheduler/build/src/users/production-membership.js'),
  denied = new Set([999, 110, 111]),
  revoked = new Set()
http
  .createServer((req, res) => {
    if(req.method==='POST'&&req.url==='/api/logout?everywhere=false'){const token=(req.headers.authorization||'').replace(/^Bearer /,'');const valid=s.users.some(u=>s.tokens[String(u.userID)]===token&&!revoked.has(u.userID));res.writeHead(valid?204:401);res.end();return}
    if (req.url === '/api/me') {
      const token = (req.headers.authorization || '').replace(
          /^Bearer /,
          '',
        ),
        u = s.users.find(
          (u) =>
            s.tokens[String(u.userID)] === token && !revoked.has(u.userID),
        )
      res.writeHead(u ? 200 : 401, { 'Content-Type': 'application/json' })
      let membership = null
      if (u && !denied.has(u.userID)) {
        const record = {
          version: 1,
          status: 'verified',
          userID: u.userID,
          email: u.email.toLowerCase(),
          department: u.department,
          role: u.role,
          productionId: u.userID === 115 ? 'other-production' : 'whiteout',
          verifiedAt: '2026-11-02T12:00:00Z',
          verifiedBy: 'Controlled QA producer',
          evidence: 'Disposable local membership acceptance',
        }
        membership = verifiedMembership(JSON.stringify(record), {
          ID: u.userID,
          Email: u.email,
          Department: u.department,
          Role: u.role,
        })
      }
      res.end(
        JSON.stringify(
          u
            ? { ...u, productionMembership: membership }
            : { message: 'Invalid local session' },
        ),
      )
      return
    }
    const m = req.url?.match(/^\/qa\/(team\/)?(revoke|restore)\/(\d+)$/)
    if (req.method === 'POST' && m) {
      const set = m[1] ? denied : revoked
      m[2] === 'revoke' ? set.add(Number(m[3])) : set.delete(Number(m[3]))
      res.end('ok')
      return
    }
    res.writeHead(404)
    res.end()
  })
  .listen(4311, '127.0.0.1', () =>
    console.log('M05 controlled membership QA authority on loopback4311.'),
  )
