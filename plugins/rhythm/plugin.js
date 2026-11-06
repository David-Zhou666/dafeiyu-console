/* 今日节奏 · 示例插件
 *
 * 只做一件事：把 /api/overview 里的作息、开口时刻、心情画出来。
 * 所有数据走 qiyu.call('overview.get')，插件自己不 fetch。
 */

(() => {
  const $ = (s) => document.querySelector(s)
  const W = 720
  const 顶 = 26
  const 带顶 = 46
  const 带高 = 58
  const 轴底 = 132

  const 默认时段 = [
    { 名: '休息', 起: '00:00', 止: '08:30' },
    { 名: '惰性', 起: '08:30', 止: '19:30' },
    { 名: '活跃', 起: '19:30', 止: '24:00' },
  ]
  const 带色 = { 休息: '#eef1f6', 惰性: '#f6f7f9', 活跃: 'rgba(77,107,254,0.14)' }
  const 边色 = { 休息: '#e3e7ee', 惰性: '#e8ebf0', 活跃: 'rgba(77,107,254,0.28)' }

  const 转义 = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

  function 分钟值(t) {
    const m = /^(\d{1,2}):(\d{1,2})$/.exec(String(t || '').trim())
    if (!m) return null
    return Math.min(1440, Number(m[1]) * 60 + Number(m[2]))
  }

  function x(分) {
    return (分 / 1440) * W
  }

  function 时刻(分) {
    const h = Math.floor(分 / 60)
    const m = Math.round(分 % 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  function 画(d) {
    const 时段 = Array.isArray(d?.作息?.时段) && d.作息.时段.length ? d.作息.时段 : 默认时段
    const 说话 = Array.isArray(d?.行为?.今天说话) ? d.行为.今天说话 : []
    const 点们 = 说话
      .map((s) => {
        const m = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*$/.exec(String(s))
        return m ? { 分: Number(m[1]) * 60 + Number(m[2]), 原文: String(s) } : null
      })
      .filter(Boolean)

    const 现在 = new Date()
    const 现在分 = 现在.getHours() * 60 + 现在.getMinutes()

    let s = ''
    // 6 小时刻度
    for (let h = 0; h <= 24; h += 6) {
      const xx = x(h * 60)
      s += `<line x1="${xx}" y1="${顶}" x2="${xx}" y2="${轴底 + 8}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="2 4"/>`
    }
    // 作息带
    for (const b of 时段) {
      const a = 分钟值(b.起)
      const z = 分钟值(b.止)
      if (a == null || z == null || z <= a) continue
      const w = Math.max(0, x(z) - x(a))
      s += `<rect x="${x(a)}" y="${带顶}" width="${w}" height="${带高}" rx="4" fill="${带色[b.名] || '#f5f6f8'}" stroke="${边色[b.名] || '#e8ebf0'}"/>`
      if (w > 54) {
        s += `<text x="${x(a) + w / 2}" y="${带顶 + 带高 / 2 + 4}" text-anchor="middle" font-size="11" fill="#8a94a6">${转义(b.名)}</text>`
      }
    }
    // 底线
    s += `<line x1="0" y1="${轴底}" x2="${W}" y2="${轴底}" stroke="#e5e7eb"/>`
    // 她开口的点
    点们.forEach((p, i) => {
      const xx = x(p.分)
      const yy = 轴底 - 8 - (i % 3) * 5
      s += `<circle cx="${xx}" cy="${yy}" r="3.6" fill="#4d6bfe" opacity="0.92"><title>${转义(p.原文)}</title></circle>`
    })
    // 现在
    const nx = x(现在分)
    s += `<line x1="${nx}" y1="${顶 - 4}" x2="${nx}" y2="${轴底 + 6}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3 3"/>`
    const 标签x = Math.min(Math.max(nx + 6, 6), W - 64)
    s += `<text x="${标签x}" y="${顶 + 2}" font-size="10.5" fill="#dc2626">现在 ${时刻(现在分)}</text>`

    $('#r-svg').innerHTML = s

    const 行为 = d?.行为 || {}
    $('#r-mood').textContent = d?.心情 == null ? '—' : d.心情
    $('#r-mood').style.color = d?.心情 != null && d.心情 < 40 ? '#dc2626' : ''
    $('#r-reply').textContent = 行为.回复 ?? 0
    $('#r-recv').textContent = 行为.收到 ?? 0
    $('#r-act').textContent = 行为.主动 ?? 0
    $('#r-now').textContent = `今天 ${点们.length} 次开口`
    $('#r-sub').textContent = `${d?.时钟 || ''} · ${d?.档位 || ''} · ${d?.dsh活着 ? 'dsh 在跑' : 'dsh 没回'}`
    $('#r-sub').classList.remove('r-error')
  }

  async function 刷新() {
    try {
      const d = await window.qiyu.call('overview.get')
      画(d)
    } catch (err) {
      $('#r-sub').textContent = '读不到数据：' + ((err && err.message) || err)
      $('#r-sub').classList.add('r-error')
    }
  }

  if (window.qiyu.standalone) {
    $('#r-sub').textContent = '请从控制台的「插件」页打开'
    $('#r-sub').classList.add('r-error')
    return
  }

  window.qiyu.ready.then((hello) => {
    if (hello && hello.name) $('#r-host').textContent = '宿主 · ' + hello.name
  })

  刷新()
  setInterval(() => {
    if (!document.hidden) 刷新()
  }, 30000)
})()
