# 大肥鱼控制台 · 插件宿主（公开版）

> 一个给本地 AI 伴侣控制台用的**可视化插件宿主**：插件跑在 sandbox iframe 里，宿主按清单权限转发只读 API，插件可以用任意前端栈画自己的面板。
>
> 这是从私人「大肥鱼」项目里抽出来的公开层；完整的角色、QQ/NapCat、记忆/手机运行时不在这里，也不建议照搬。

![Node](https://img.shields.io/badge/node-%3E%3D20-339933)
![License](https://img.shields.io/badge/license-MIT-blue)
![ci](https://github.com/David-Zhou666/dafeiyu-console/actions/workflows/ci.yml/badge.svg)

---

## 这是什么

一个没有构建步骤的插件系统：

- **宿主**（`plugins/index.html` + `gallery.js`）：列插件、开弹窗、把 `/api/*` 的只读数据转发给插件。
- **插件**（`plugins/<id>/`）：普通 HTML/CSS/JS，跑在 `sandbox="allow-scripts allow-forms"` 的 iframe 里（不带 `allow-same-origin`）。
- **SDK**（`plugins/sdk.js`）：`qiyu.call('overview.get')`、`qiyu.call('toast', …)`。
- **权限**：清单里写 `permissions`，宿主只放行对应的方法。
- **示例**：`plugins/rhythm/`「今日节奏」——作息带 + 开口时刻 + 心情。

它解决的不是「怎么画图」，而是「怎么让第三方/模型生成的插件碰不到主程序的 DOM、cookie、token」。

---

## 跑起来

```bash
# Node 20+
node demo/server.mjs
# open http://127.0.0.1:7800
```

`demo/server.mjs` 用内存里的假 `/api/overview` 启动宿主；真正的控制台（私有）里，宿主嵌在 `127.0.0.1:7788`。

冒烟测试：

```bash
node demo/smoke.mjs
```

---

## 加一个插件

1. 建目录：

```
plugins/my-panel/
├─ index.html
├─ panel.js
└─ panel.css
```

2. 在 `plugins/registry.js` 加一条：

```js
{
  id: 'my-panel',
  name: '我的面板',
  version: '0.1.0',
  desc: '一句话说明',
  icon: '◈',
  permissions: ['overview:read'],
  entry: '/plugins/my-panel/index.html',
}
```

3. 插件里：

```html
<script src="/plugins/sdk.js"></script>
<script>
  const d = await qiyu.call('overview.get')
  document.body.textContent = '心情 ' + d.心情
</script>
```

4. 刷新 `http://127.0.0.1:7800`。

完整字段、SDK 方法、权限表见 [`docs/PLUGINS.md`](docs/PLUGINS.md)。

接自己的模型/后端：见 [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md)。**API key 只能放在服务端环境变量，不能进浏览器或 Git。**

---

## 宿主 API（当前）

| 方法 | 权限 | 说明 |
|---|---|---|
| `overview.get` | `overview:read` | 概览/心情/今日行为 |
| `stats.get` | `stats:read` | 14 天统计 |
| `config.get` | `config:read` | 脱敏配置 |
| `persona.get` | `persona:read` | 人格文本 |
| `group.get` | `group:read` | 群聊设置 |
| `toast` | 无 | 宿主弹提示 |

写操作（聊天、改配置、发语音）没有开放：需要确认弹窗、审计和权限模型，不能只靠一个字符串。

---

## 安全模型

- 插件 iframe **不带 `allow-same-origin`**：不透明源，拿不到父页 DOM、cookie、localStorage。
- 宿主只接受来自当前 iframe 的 `message`（`e.source === frame.contentWindow`）。
- 方法白名单 + 权限白名单，未知方法直接拒绝。
- 插件文件是本地可信文件；远程安装需要签名 + 权限确认（未实现）。
- 没有 `eval`、没有 `document.write`、没有把插件 HTML 拼进主页面。

---

## 目录

```
plugins/            宿主 + SDK + 示例插件
demo/server.mjs     假 API + 静态服务
demo/smoke.mjs      冒烟测试
docs/               插件与架构说明
.github/workflows/  CI
```

---

## 范围

这个仓库是**公开层**：插件宿主、SDK、示例、文档、demo。

不包含：

- QQ / NapCat / 平台风控相关实现；
- 个人角色人格、记忆、日记、聊天记录；
- 第三方补丁包；
- IndexTTS 权重、venv、参考音。

---

## License

MIT，见 [LICENSE](LICENSE)。示例插件与文档同样 MIT。
