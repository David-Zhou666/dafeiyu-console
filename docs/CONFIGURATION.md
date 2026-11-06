# 接自己的 API

这个公开仓库**不需要任何 API key** 就能跑：`demo/server.mjs` 用的是内存里的假数据。

要接你自己的模型/后端，记住一条：**key 只在服务端，永远不进浏览器、不进 Git。**

---

## 1. 先分清两层

```
浏览器（插件 iframe）  →  postMessage  →  插件宿主  →  GET /api/*  →  你的后端
                                          （同源）                    （key 在这里）
```

- 插件 iframe 是 sandbox，不能直接 fetch `/api/*`。
- 插件宿主（`plugins/gallery.js`）负责 fetch，再把结果 postMessage 给插件。
- **API key 只能放在宿主/后端进程的环境变量里**，不能写进 `plugins/`、`registry.js`、`README` 或 Git。

---

## 2. 宿主现在会请求的接口

`demo/server.mjs` 里是假数据；接真后端时，保持同样的路径和字段即可。

### `GET /api/overview`

```json
{
  "ok": true,
  "dsh活着": true,
  "时钟": "22:26",
  "档位": "活跃",
  "心情": 70,
  "行为": {
    "回复": 17,
    "收到": 15,
    "主动": 2,
    "今天说话": ["11-06 08:53:42", "11-06 19:32:15"]
  },
  "作息": {
    "时区": "Asia/Shanghai",
    "时段": [
      { "名": "休息", "起": "00:00", "止": "08:30" },
      { "名": "惰性", "起": "08:30", "止": "19:30" },
      { "名": "活跃", "起": "19:30", "止": "24:00" }
    ]
  }
}
```

### 可选接口

| 路径 | 用途 | 最少字段 |
|---|---|---|
| `GET /api/stats` | 统计插件 | `ok`, `序列[]`, `今日{}` |
| `GET /api/config` | 配置面板 | `ok`, `主动{}`, `桥{}`, `作息{}`, `角色{}` |
| `GET /api/persona` | 人格文本 | `ok`, `文本`, `路径` |
| `GET /api/group` | 群聊设置 | `ok`, `群会话`, `正在听[]`, `黑名单[]` |

只返回展示需要的字段，**不要把 provider 原始响应、token、系统提示词原样透传**。

---

## 3. 接一个 OpenAI 兼容接口（示例）

`.env`（不要提交）：

```dotenv
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
LLM_API_KEY=sk-your-key
```

`demo/server.mjs` 里加一个只在服务端跑的调用：

```js
const r = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
  method: 'POST',
  headers: {
    authorization: `Bearer ${process.env.LLM_API_KEY}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    model: process.env.LLM_MODEL,
    messages: [{ role: 'user', content: '你好' }],
  }),
})

const data = await r.json()
// 只把要展示的文本返回给前端，不要把 key / 原始 header 带出去
res.end(JSON.stringify({ ok: true, 文本: data.choices?.[0]?.message?.content || '' }))
```

启动：

```powershell
node --env-file=.env demo/server.mjs
```

Node 20.6+ 支持 `--env-file`。也可以用系统环境变量：

```powershell
$env:LLM_API_KEY = "sk-your-key"
node demo/server.mjs
```

> 不要把 key 写进 PowerShell 历史或截图；生产环境用密钥管理/系统环境变量。

---

## 4. 想加“聊天”插件

现在宿主只开了只读方法（`overview.get` 等）。要发消息，需要三处一起改：

1. `plugins/gallery.js` 的 `权限表` 加 `'chat.send': 'chat:write'`；
2. 对应的 `POST /api/chat` 服务端路由（key 只在服务端）；
3. 插件清单 `permissions` 加 `chat:write`，并在 UI 上做二次确认。

不要只在前端加一个“发送”按钮就完事——宿主不认的方法会被直接拒绝。

---

## 5. 公开部署的底线

- 不要把这个 demo 直接暴露到公网：它没有登录、没有限流、没有 CSRF 防护。
- 公网部署至少加：HTTPS、登录/会话、写接口 CSRF、按用户限流、日志脱敏。
- 插件 sandbox 不是服务端安全边界；它只隔离浏览器里的 DOM/cookie。
- 不要把 `.env`、`*.log`、数据库、个人路径提交进 Git。
