/* 大肥鱼控制台 · 插件宿主（可信侧）
 *
 * 职责只有三件：
 *   1. 从 registry.js 读插件清单，画成卡片；
 *   2. 用 sandbox iframe 打开插件；
 *   3. 在 iframe 和 /api/* 之间做一层白名单转发。
 *
 * 插件永远拿不到 console 的 DOM / cookie / localStorage：
 *   iframe 不带 allow-same-origin，它是个不透明源，只能 postMessage。
 *
 * 加一个插件：在 plugins/<id>/ 放页面，然后在 registry.js 里加一条。
 */

(() => {
  const $ = (s) => document.querySelector(s)
  let 插件们 = Array.isArray(window.QIYU_PLUGINS) ? window.QIYU_PLUGINS : []
  const 网格 = $('#g-grid')
  const 弹窗 = $('#g-modal')
  const 框 = $('#g-frame')
  let 当前 = null

  // 方法 → 需要的权限。没列在这里的方法一律拒绝。
  const 权限表 = {
    'overview.get': 'overview:read',
    'stats.get': 'stats:read',
    'config.get': 'config:read',
    'persona.get': 'persona:read',
    'group.get': 'group:read',
  }
  const 权限字 = {
    'overview:read': '读取概览',
    'stats:read': '读取统计',
    'config:read': '读取配置',
    'persona:read': '读取人设',
    'group:read': '读取群聊设置',
  }

  const 转义 = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

  function 画() {
    $('#g-count').textContent = `${插件们.length} 个`
    if (!插件们.length) {
      网格.innerHTML = '<div class="g-empty">还没有插件。往 <code>console/public/plugins/</code> 里放一个，再在 <code>registry.js</code> 里登记。</div>'
      return
    }
    网格.innerHTML = 插件们
      .map(
        (p) => `
      <button class="g-card" type="button" data-plugin="${转义(p.id)}">
        <div class="g-card-top">
          <span class="g-icon">${转义(p.icon || '◈')}</span>
          <div>
            <div class="g-name">${转义(p.name || p.id)}</div>
            <div class="g-ver">v${转义(p.version || '0.0.0')}</div>
          </div>
        </div>
        <div class="g-desc">${转义(p.desc || '')}</div>
        <div class="g-tags">${(p.permissions || []).map((x) => `<span class="g-tag">${转义(权限字[x] || x)}</span>`).join('') || '<span class="g-tag">只读</span>'}</div>
        <div class="g-go">打开 ›</div>
      </button>`
      )
      .join('')
  }

  function 打开(p) {
    if (!p.entry) return 吐司('这个插件没写 entry')
    当前 = p
    $('#g-m-name').textContent = p.name || p.id
    $('#g-m-ver').textContent = 'v' + (p.version || '0.0.0')
    $('#g-m-perms').innerHTML = (p.permissions || [])
      .map((x) => `<span class="g-perm">${转义(权限字[x] || x)}</span>`)
      .join('')
    框.src = p.entry
    弹窗.hidden = false
    document.body.style.overflow = 'hidden'
  }

  function 关() {
    框.src = 'about:blank'
    弹窗.hidden = true
    当前 = null
    document.body.style.overflow = ''
  }

  async function 取JSON(url) {
    const r = await fetch(url, { headers: { accept: 'application/json' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  }

  function 回(id, ok, data, error) {
    if (!框.contentWindow) return
    框.contentWindow.postMessage({ qiyu: 1, id, ok, data, error }, '*')
  }

  window.addEventListener('message', async (e) => {
    if (!当前 || !框.contentWindow || e.source !== 框.contentWindow) return
    const d = e.data
    if (!d || d.qiyu !== 1) return

    if (d.type === 'ready') {
      框.contentWindow.postMessage(
        { qiyu: 1, type: 'hello', plugin: { id: 当前.id, name: 当前.name, permissions: 当前.permissions || [] } },
        '*'
      )
      return
    }

    if (!d.id || !d.method) return
    const 需要 = 权限表[d.method]
    if (需要 && !(当前.permissions || []).includes(需要)) {
      return 回(d.id, false, null, `缺少权限 ${需要}`)
    }
    if (d.method === 'toast') {
      吐司(String(d.params && d.params.text || ''))
      return 回(d.id, true, true)
    }
    if (!需要) return 回(d.id, false, null, `未知方法 ${d.method}`)

    try {
      let data
      if (d.method === 'overview.get') data = await 取JSON('/api/overview')
      else if (d.method === 'stats.get') data = await 取JSON('/api/stats?days=14')
      else if (d.method === 'config.get') data = await 取JSON('/api/config')
      else if (d.method === 'persona.get') data = await 取JSON('/api/persona')
      else if (d.method === 'group.get') data = await 取JSON('/api/group')
      回(d.id, true, data)
    } catch (err) {
      回(d.id, false, null, String((err && err.message) || err))
    }
  })

  // 事件委托：卡片是动态画的，不用逐个挂
  网格.addEventListener('click', (e) => {
    const 卡 = e.target.closest('[data-plugin]')
    if (!卡) return
    const p = 插件们.find((x) => x.id === 卡.dataset.plugin)
    if (p) 打开(p)
  })

  $('#g-m-close').addEventListener('click', 关)
  弹窗.addEventListener('click', (e) => {
    if (e.target === 弹窗) 关()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !弹窗.hidden) 关()
  })
  $('#g-refresh').addEventListener('click', 画)

  let 吐司钟 = 0
  function 吐司(text) {
    if (!text) return
    let 条 = document.querySelector('.g-toast')
    if (!条) {
      条 = document.createElement('div')
      条.className = 'g-toast'
      document.body.appendChild(条)
    }
    条.textContent = text
    条.classList.add('is-on')
    clearTimeout(吐司钟)
    吐司钟 = setTimeout(() => 条.classList.remove('is-on'), 2200)
  }

  画()

  // 有服务端清单就用扫描结果；静态托管（GitHub Pages）没有这个接口，继续用 registry。
  fetch('/api/plugins', { headers: { accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d && Array.isArray(d.插件们) && d.插件们.length) {
        插件们 = d.插件们
        画()
      }
    })
    .catch(() => {})
})()
