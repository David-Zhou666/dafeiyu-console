#!/usr/bin/env node
/**
 * 仓库卫生扫描：token / secret / 个人路径 / QQ 号。
 * 不输出命中的原文，只给类型 + 文件:行。
 *
 *   node tools/release-check.mjs
 *   node tools/release-check.mjs --json
 *
 * 退出码：有 critical → 1；只有 warn → 0。
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const 根 = fileURLToPath(new URL('../', import.meta.url))
const JSON出 = process.argv.includes('--json')
const 跳目录 = new Set(['.git', 'node_modules', 'dist', 'coverage'])
const 文本 = new Set(['.js', '.mjs', '.json', '.md', '.yml', '.yaml', '.html', '.css', '.txt'])

const 规则 = [
  { 级: 'critical', 名: 'token / secret 赋值', re: /\b(?:token|secret|password|passwd|api[_-]?key)\b\s*[:=]\s*['"][^'"\s]{12,}['"]/gi },
  { 级: 'critical', 名: 'Bearer 令牌', re: /Bearer\s+[A-Za-z0-9._-]{20,}/g },
  { 级: 'critical', 名: 'sk- API key', re: /\bsk-[A-Za-z0-9_-]{20,}/g },
  { 级: 'critical', 名: 'appSecret', re: /\bappSecret\s*[:=]\s*['"][A-Za-z0-9]{16,}['"]/g },
  { 级: 'warn', 名: 'QQ/长数字', re: /(?<!\d)\d{9,10}(?!\d)/g },
  { 级: 'warn', 名: 'Windows 用户路径', re: /C:\\Users\\[^\\\s]+/gi },
  { 级: 'warn', 名: '邮箱', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
]

const 命中 = []

function 走(目录) {
  for (const 项 of readdirSync(目录, { withFileTypes: true })) {
    if (跳目录.has(项.name)) continue
    const 全 = join(目录, 项.name)
    if (项.isDirectory()) {
      走(全)
      continue
    }
    if (!文本.has(extname(项.name).toLowerCase())) continue
    if (项.name === 'release-check.mjs') continue
    if (statSync(全).size > 2 * 1024 * 1024) continue
    const 相对 = relative(根, 全)
    const 行们 = readFileSync(全, 'utf8').split('\n')
    for (const 规 of 规则) {
      for (let i = 0; i < 行们.length; i++) {
        规.re.lastIndex = 0
        if (!规.re.test(行们[i])) continue
        命中.push({ 级: 规.级, 名: 规.名, 文件: 相对, 行: i + 1 })
      }
    }
  }
}

走(根)

const critical = 命中.filter((x) => x.级 === 'critical')
const warn = 命中.filter((x) => x.级 === 'warn')

if (JSON出) {
  console.log(JSON.stringify({ critical: critical.length, warn: warn.length, 命中 }, null, 2))
} else {
  console.log(`release-check · critical ${critical.length} / warn ${warn.length}`)
  for (const h of 命中.slice(0, 50)) console.log(`${h.级 === 'critical' ? '✗' : '!'} ${h.名} · ${h.文件}:${h.行}`)
  if (命中.length > 50) console.log(`… 还有 ${命中.length - 50} 条`)
  if (!命中.length) console.log('干净。')
}

process.exitCode = critical.length ? 1 : 0
