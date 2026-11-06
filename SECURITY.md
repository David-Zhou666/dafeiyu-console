# 安全策略

## 支持版本

当前公开层是 `0.1.x`。安全问题请针对最新 `main`。

## 报告

请用 GitHub 的 **Security advisory**（仓库 → Security → Advisories）私下报告，不要先开公开 issue 放利用代码。

请说明：

- 影响的是宿主（`plugins/gallery.js`）还是示例插件；
- 复现步骤；
- 是否能读到父页 DOM / cookie / `/api/*`；
- 是否能绕过权限表或 `sandbox`。

## 威胁模型

- **宿主是可信的**：它和 `/api/*` 同源，能读数据。
- **插件是不可信的**：可能来自第三方或模型生成。
- 插件 iframe 不带 `allow-same-origin`，拿不到父页 DOM、cookie、localStorage。
- 宿主只接受当前 iframe 的 `message`，方法/权限双白名单。
- 没有写 API；没有远程安装；没有 `eval`。

## 不在范围

- 私人运行时的 QQ/NapCat、角色人格、记忆、手机控制、TTS 权重；
- 用户自己改掉 `sandbox` 属性后产生的问题；
- 浏览器 0day。

## 仓库卫生

- 不提交 token、secret、cookie、`.env`、个人路径、QQ 号。
- CI 会跑 `tools/release-check.mjs`。
