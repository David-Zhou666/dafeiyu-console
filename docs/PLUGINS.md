# 插件开发

## 目录

```
plugins/
├─ index.html          宿主页
├─ gallery.js          宿主逻辑：清单、沙箱、权限、postMessage
├─ gallery.css
├─ registry.js         插件清单
├─ sdk.js              插件侧 SDK
├─ rhythm/             示例：今日节奏
└─ README.md           本文件
```

## 清单字段

```js
{
  id: 'rhythm',                 // 唯一，建议等于目录名
  name: '今日节奏',
  version: '0.1.0',
  desc: '一句话说明',
  icon: '◔',                   // 一个字符/emoji
  permissions: ['overview:read'],
  entry: '/plugins/rhythm/index.html',
}
```

`id` 只用小写字母、数字、短横线；`entry` 必须在 `/plugins/` 下。

## SDK

```html
<script src="/plugins/sdk.js"></script>
```

```js
const d = await qiyu.call('overview.get')
qiyu.call('toast', { text: '刷新好了' })

// 可选：等宿主握手
const hello = await qiyu.ready   // { id, name, permissions }
```

### 方法

| 方法 | 权限 | 返回 |
|---|---|---|
| `overview.get` | `overview:read` | 概览/心情/行为 |
| `stats.get` | `stats:read` | 14 天统计 |
| `config.get` | `config:read` | 脱敏配置 |
| `persona.get` | `persona:read` | 人格文本 |
| `group.get` | `group:read` | 群聊设置 |
| `toast` | 无 | 宿主弹提示 |

调用失败会 `reject`，错误信息是宿主返回的 `error`。**不要静默吞掉**，至少显示一行。

## 权限

现在只开只读。权限写在清单里；宿主只放行对应方法，没写就拒绝。

写操作（聊天、改配置、发语音）没有开放：需要确认弹窗、审计和单独的权限模型。

## 安全模型

- 插件 iframe：`sandbox="allow-scripts allow-forms"`，**不带 `allow-same-origin`**。
- 不透明源：拿不到父页 DOM、cookie、localStorage，也不能直接 `fetch('/api/...')`。
- 宿主只接受当前 iframe 的 `message`（`e.source === frame.contentWindow`）。
- 方法白名单 + 权限白名单；未知方法直接拒绝。
- 插件文件是本地可信文件；远程安装需要签名 + 权限确认（未实现）。

## 限制

- 不能写：没有 `chat.say`、`config.set`、`tts`。
- 不能加左侧导航：所有插件都在「插件」页里打开。
- 不能常驻后台：关掉弹窗 iframe 销毁。
- 不能用 localStorage：需要记住偏好先放内存。
- 单独打开插件页会提示「请从控制台的插件页打开」。

## 调试

- `node demo/server.mjs` → `http://127.0.0.1:7800`。
- 浏览器 DevTools 里能看到插件 iframe 的 console。
- 改完 `registry.js` 或插件文件，刷新页面即可；没有构建步骤。
- 宿主报错会以 `reject` 回到插件，不要把 `catch` 写成空的。

## 示例：今日节奏

`plugins/rhythm/` 用 `overview.get` 画：

- 24 小时作息带（休息/惰性/活跃）
- 她今天开口的时刻
- 心情、回复/收到/主动

没有图表库，全是 SVG；可以直接抄。
