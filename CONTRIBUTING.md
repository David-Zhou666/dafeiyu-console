# 贡献

## 环境

- Node.js 20+
- 不需要安装依赖；没有构建步骤
- 跑：

```bash
node demo/smoke.mjs
node demo/server.mjs   # http://127.0.0.1:7800
```

## 改插件宿主

涉及 `plugins/gallery.js` / `sdk.js` 的改动，请同时：

1. 更新 `docs/PLUGINS.md` 的方法/权限表；
2. 在 `demo/smoke.mjs` 里补一个请求或断言；
3. 确认示例插件 `plugins/rhythm/` 仍然能打开。

## 加示例插件

- 一个目录只做一件事；
- 不引第三方 CDN（demo 要离线可跑）；
- 不写 `eval` / `document.write`；
- 带一句 `desc` 和一个 `permissions` 数组；
- 不提交个人数据、真实 API 地址、token。

## 代码风格

- 原生 JS，ESM；
- 2 空格缩进，单引号；
- 中文注释可以，变量名中英混排以可读为准；
- 不引入框架/打包器，除非有明确理由。

## PR

- 说明「改了什么 / 为什么 / 怎么验证」；
- CI 必须绿；
- 安全相关改动请先看 `SECURITY.md`。
