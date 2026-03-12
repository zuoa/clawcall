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

如果你要联调 `/api/book` 里的飞书/ webhook 写入，先复制一份本地变量文件：

```bash
cp .dev.vars.example .dev.vars
```

当前项目支持两种本地运行方式：

- `npm run dev`
  - 使用 Astro 开发服务器
  - 现在也会回退读取本机 `process.env`，适合普通页面开发
- `npm run preview`
  - 先构建，再用 `wrangler dev` 启动 Worker
  - 更接近 Cloudflare 线上环境，联调 `/api/book` 时更推荐

## 环境变量

本地开发可创建 `.dev.vars`，线上在 Cloudflare Workers 中配置以下变量。

至少满足下面两种方式之一：

方式 A：写入飞书多维表格

- `FEISHU_APP_ID`
  - 飞书自建应用的 App ID
- `FEISHU_APP_SECRET`
  - 飞书自建应用的 App Secret
- `FEISHU_BITABLE_APP_TOKEN`
  - 多维表格所属应用的 `app_token`
- `FEISHU_BITABLE_TABLE_ID`
  - 具体数据表的 `table_id`

方式 B：只发 webhook 通知

- `BOOKING_WEBHOOK_URL`
  - 可只配置这一项
  - 适合暂时不接多维表格，只把预约转发到飞书机器人或你自己的 webhook

附加可选项：

- `BOOKING_WEBHOOK_URL`
  - 可选
  - 如果你已经配置了多维表格，又想额外同步发一条飞书群提醒，可以继续配置机器人 webhook
- `BOOKING_WEBHOOK_TYPE`
  - 可选
  - `feishu` 或 `generic`
  - 默认 `feishu`

如果你的多维表格列名不是下面这些默认中文名，可以继续配置：

- `FEISHU_FIELD_PLAN`
- `FEISHU_FIELD_REGION`
- `FEISHU_FIELD_CITY`
- `FEISHU_FIELD_SCHEDULE`
- `FEISHU_FIELD_NAME`
- `FEISHU_FIELD_CONTACT`
- `FEISHU_FIELD_NOTES`
- `FEISHU_FIELD_SUBMITTED_AT`

SEO 推荐再配置一个公开变量（用于 canonical、sitemap、结构化数据）：

- `PUBLIC_SITE_URL`
  - 建议填写你的正式域名，例如 `https://your-domain.com`
  - 不要带结尾 `/`

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

如果你实际列名不同，例如你表里叫 `套餐类型`、`预约区域`、`联系电话`，就把对应的 `FEISHU_FIELD_*` 环境变量改成你的真实列名。

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

## SEO 最佳实践（已落地）

- 全局 canonical、Open Graph、Twitter Card、`robots` 指令已配置
- 已添加结构化数据：`WebSite`、`Organization`、`WebPage`、`Service`、`FAQPage`
- 已添加 `robots.txt`（允许抓取页面，屏蔽 `/api/`）
- 已添加 `sitemap.xml`（当前收录首页）
- API 响应已加 `X-Robots-Tag: noindex`
- 已补充 `favicon` 与默认社交分享图 `og-image.svg`

上线后建议手动完成：

1. 在 Google Search Console/Bing Webmaster 提交 `https://你的域名/sitemap.xml`
2. 在百度搜索资源平台提交站点与 sitemap
3. 以真实域名验证 `PUBLIC_SITE_URL`，避免 canonical 指向错误域名
4. 用 Rich Results Test 验证 FAQ/Service 结构化数据
