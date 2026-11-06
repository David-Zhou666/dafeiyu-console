import assert from 'node:assert/strict'
import { createDemoServer } from './server.mjs'

const 服 = createDemoServer()
await new Promise((r) => 服.listen(0, '127.0.0.1', r))
const { port } = 服.address()
const 基 = `http://127.0.0.1:${port}`

try {
  const health = await fetch(基 + '/health')
  assert.equal(health.status, 200)

  const ov = await fetch(基 + '/api/overview')
  assert.equal(ov.status, 200)
  const j = await ov.json()
  assert.equal(j.心情, 70)
  assert.equal(j.作息.时段.length, 3)

  const pl = await fetch(基 + '/api/plugins')
  assert.equal(pl.status, 200)
  const pj = await pl.json()
  assert.equal(pj.插件们.length, 1)
  assert.equal(pj.插件们[0].id, 'rhythm')

  for (const p of ['/plugins/index.html', '/plugins/gallery.js', '/plugins/sdk.js', '/plugins/rhythm/index.html', '/plugins/rhythm/plugin.js']) {
    const r = await fetch(基 + p)
    assert.equal(r.status, 200, p)
  }

  const html = await (await fetch(基 + '/plugins/rhythm/index.html')).text()
  assert.ok(html.includes('今天的节奏'))

  console.log('demo smoke: 通过')
} finally {
  服.close()
}
