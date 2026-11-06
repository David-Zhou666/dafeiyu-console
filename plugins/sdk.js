/* 大肥鱼控制台 · 插件 SDK（跑在 sandbox iframe 里）
 *
 * 用法：
 *   const d = await qiyu.call('overview.get')
 *   qiyu.call('toast', { text: '你好' })
 *
 * 只能调宿主白名单里的方法；没有直接 fetch / cookie / localStorage。
 * 单独打开插件页时（不在控制台里），qiyu.standalone = true，call 会直接报错。
 */
(() => {
  if (window.qiyu) return

  const 独立 = window.parent === window
  let 序号 = 0
  const 等待 = new Map()
  const 监听 = new Map()
  let 就绪resolve = null
  const 就绪 = new Promise((r) => {
    就绪resolve = r
  })

  function call(method, params, 超时 = 12000) {
    if (独立) return Promise.reject(new Error('请从控制台的「插件」页打开'))
    return new Promise((resolve, reject) => {
      const id = ++序号
      const 钟 = setTimeout(() => {
        等待.delete(id)
        reject(new Error('宿主没有回应（12 秒）'))
      }, 超时)
      等待.set(id, { resolve, reject, 钟 })
      window.parent.postMessage({ qiyu: 1, id, method, params: params || {} }, '*')
    })
  }

  function on(事件, fn) {
    if (typeof fn !== 'function') return () => {}
    const 表 = 监听.get(事件) || []
    表.push(fn)
    监听.set(事件, 表)
    return () => off(事件, fn)
  }

  function off(事件, fn) {
    const 表 = 监听.get(事件)
    if (!表) return
    监听.set(
      事件,
      表.filter((x) => x !== fn)
    )
  }

  window.addEventListener('message', (e) => {
    const d = e.data
    if (!d || d.qiyu !== 1) return

    if (d.type === 'hello') {
      就绪resolve && 就绪resolve(d.plugin || {})
      就绪resolve = null
      return
    }

    if (d.id && 等待.has(d.id)) {
      const 项 = 等待.get(d.id)
      clearTimeout(项.钟)
      等待.delete(d.id)
      if (d.ok) 项.resolve(d.data)
      else 项.reject(new Error(d.error || '调用失败'))
      return
    }

    if (d.event) {
      for (const fn of 监听.get(d.event) || []) {
        try {
          fn(d.data)
        } catch (err) {
          /* 一个监听器炸了不影响别的 */
        }
      }
    }
  })

  window.qiyu = {
    version: '0.1.0',
    standalone: 独立,
    call,
    on,
    off,
    ready: 就绪,
  }

  try {
    window.parent.postMessage({ qiyu: 1, type: 'ready' }, '*')
  } catch (err) {
    /* 独立打开时 parent 就是自己，忽略 */
  }
})()
