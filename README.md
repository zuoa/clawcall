# Openclaw Cloudflare Landing

一个可直接部署到 Cloudflare Workers 的 Astro 落地页，用于介绍 OpenClaw 上门安装服务，并收集预约信息。

## 技术选型

- `Astro`：适合落地页，默认静态优先，性能好
- `@astrojs/cloudflare`：直接输出 Cloudflare Workers 兼容产物
- Worker API：`/api/book` 接收预约并直接写入飞书多维表格

## 本地开发

```bash
npm install
npm run dev
```

## 环境变量

本地开发可创建 `.dev.vars`，线上在 Cloudflare Workers 中配置以下变量：

- `FEISHU_APP_ID`
  - 必填
  - 飞书自建应用的 App ID
- `FEISHU_APP_SECRET`
  - 必填
  - 飞书自建应用的 App Secret
- `FEISHU_BITABLE_APP_TOKEN`
  - 必填
  - 多维表格所属应用的 `app_token`
- `FEISHU_BITABLE_TABLE_ID`
  - 必填
  - 具体数据表的 `table_id`

可选：

- `BOOKING_WEBHOOK_URL`
  - 可选
  - 如果你还想在写入多维表格后同步发一条飞书群提醒，可以配置机器人 webhook
- `BOOKING_WEBHOOK_TYPE`
  - 可选
  - `feishu` 或 `generic`
  - 默认 `feishu`

## 部署

```bash
npm run deploy
```

## 飞书多维表格字段

请在多维表格中创建以下字段，字段名建议保持一致：

- `套餐`
- `地区`
- `城市`
- `上门时间`
- `联系人`
- `联系方式`
- `备注`
- `提交时间`

当前代码会按这些字段名直接写入一行记录。

## 可选 webhook 通知

如果你配置了 `BOOKING_WEBHOOK_URL`，写入多维表格成功后还会额外发一条通知。

当 `BOOKING_WEBHOOK_TYPE=generic` 时，会发送 JSON：

```json
{
  "source": "openclaw-booking",
  "submittedAt": "2026-03-04T00:00:00.000Z",
  "planLabel": "499 上门安装",
  "plan": "standard",
  "region": "上海 / 苏州 / 杭州",
  "city": "上海浦东",
  "schedule": "本周六下午",
  "name": "张三",
  "contact": "13800000000",
  "notes": "已有显示器，需要迁移数据",
  "text": "Openclaw 新预约..."
}
```
