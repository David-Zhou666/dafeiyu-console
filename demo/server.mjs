/**
 * 大肥鱼控制台 · 插件宿主 demo
 *
 * 这个 demo 只做一件事：用一个假 /api/overview 把 plugins/ 里的
 * 插件宿主和「今日节奏」示例跑起来，方便看视觉和 SDK 怎么接。
 *
 *   node demo/server.mjs
 *   open http://127.0.0.1:7800
 *
 * 真正的控制台（私有仓库）里，宿主是嵌在控制台 7788 里的；
 * 这里为了公开 demo，把 /api/* 换成了内存里的假数据。
 */

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const 根 = fileURLToPath(new URL('../', import.meta.url))
const 插件目录 = join(根, 'plugins')
const PORT = Number(process.env.PORT || 7800)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
}

const 概览 = {
  ok: true,
  dsh活着: true,
  时钟: '22:26',
  档位: '活跃',
  心情: 70,
  行为: {
    回复: 17,
    收到: 15,
    主动: 2,
    今天说话: [
      '11-06 00:00:06',
      '11-06 00:00:22',
      '11-06 00:00:51',
      '11-06 08:53:42',
      '11-06 08:53:45',
      '11-06 08:55:01',
      '11-06 13:32:16',
      '11-06 19:32:15',
      '11-06 21:01:22',
      '11-06 22:26:05',
    ],
  },
  作息: {
    时区: 'Asia/Shanghai',
    时段: [
      { 名: '休息', 起: '00:00', 止: '08:30' },
      { 名: '惰性', 起: '08:30', 止: '19:30' },
      { 名: '活跃', 起: '19:30', 止: '24:00' },
    ],
  },
}

const 统计 = {
  ok: true,
  今日: { 输入: 12509, 输出: 958, 缓存读: 15913472, 调用: 24, 花费: 0 },
  序列: Array.from({ length: 14 }, (_, i) => ({
    日期: `2026-10-${String(24 + i).padStart(2, '0')}`,
    输入: 100000 + i * 12000,
    输出: 2000 + i * 100,
    缓存读: 10000000 + i * 500000,
    调用: 20 + i * 5,
    花费: 0,
    分供: {},
  })),
  流水: [
    { 时间: '11-06 22:26:05', 文本: '她开口了' },
    { 时间: '11-06 21:01:22', 文本: '主人：在吗' },
    { 时间: '11-06 19:32:15', 文本: '她自己想说话了' },
  ],
}

const 配置 = { ok: true, 主动: { 总开关: true }, 桥: { 总开关: true }, 作息: 概览.作息, 角色: { 名字: '示例角色' } }
const 人设 = { ok: true, 文本: '# 示例角色\n\n这是公开 demo 的空白人设。', 路径: 'demo', 行数: 3, 字节: 40, 备份: [] }
const 群聊 = { ok: true, 群会话: 'demo', 群会话醒着: false, 正在听: [], 黑名单: [], 速度: {} }

function 发JSON(res, 码, 体) {
  const s = JSON.stringify(体)
  res.writeHead(码, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(s)
}

async function 发文件(res, 全) {
  try {
    const 信 = await stat(全)
    if (!信.isFile()) return 发JSON(res, 404, { ok: false, 错: 'not found' })
    const buf = await readFile(全)
    res.writeHead(200, {
      'content-type': MIME[extname(全).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    })
    res.end(buf)
  } catch {
    发JSON(res, 404, { ok: false, 错: 'not found' })
  }
}

export function createDemoServer() {
  return createServer(async (req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1')
    const p = u.pathname

    if (p === '/' || p === '/index.html') {
      res.writeHead(302, { location: '/plugins/index.html' })
      return res.end()
    }
    if (p === '/health') return 发JSON(res, 200, { ok: true })

    if (p === '/api/overview') return 发JSON(res, 200, 概览)
    if (p === '/api/stats') return 发JSON(res, 200, 统计)
    if (p === '/api/config') return 发JSON(res, 200, 配置)
    if (p === '/api/persona') return 发JSON(res, 200, 人设)
    if (p === '/api/group') return 发JSON(res, 200, 群聊)

    if (p.startsWith('/plugins/')) {
      const 相对 = decodeURIComponent(p.slice('/plugins/'.length))
      const 全 = normalize(join(插件目录, 相对))
      if (!全.startsWith(插件目录 + sep)) return 发JSON(res, 403, { ok: false, 错: 'forbidden' })
      return 发文件(res, 全)
    }

    发JSON(res, 404, { ok: false, 错: 'not found' })
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createDemoServer().listen(PORT, '127.0.0.1', () => {
    console.log(`plugin host demo: http://127.0.0.1:${PORT}`)
  })
}
