# Openclaw Cloudflare Landing

[![Astro](https://img.shields.io/badge/Astro-5.x-FF5D01?logo=astro&logoColor=white)](https://astro.build/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

一个可直接部署到 Cloudflare Workers 的 Astro 落地页，用于介绍 OpenClaw 上门安装服务，并收集预约信息。

## 预览

![OpenClaw Landing Page](https://github.com/user-attachments/assets/cf7f4082-4c8b-4306-ac8b-015e1d04274f)

## 功能特性

- 🚀 **静态优先**：基于 Astro 构建，默认静态输出，性能优异
- ☁️ **Cloudflare Workers**：一键部署到 Cloudflare 边缘网络
- 📝 **预约表单**：收集用户预约信息，支持套餐选择、地区、时间等
- 📊 **飞书多维表格**：预约数据自动写入飞书多维表格
- 🔔 **Webhook 通知**：支持飞书群机器人或通用 Webhook 通知
- 🔍 **SEO 优化**：完整的 SEO 支持，包括结构化数据、Open Graph、sitemap

## 技术栈

| 技术 | 用途 |
|------|------|
| [Astro](https://astro.build/) | 静态站点生成框架 |
| [@astrojs/cloudflare](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) | Cloudflare Workers 适配器 |
| 飞书开放平台 API | 多维表格数据写入 |

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

### 部署

```bash
npm run deploy
```

## 配置

### 必需环境变量

在 Cloudflare Workers 中配置以下变量（本地开发可创建 `.dev.vars` 文件）：

| 变量名 | 说明 |
|--------|------|
| `FEISHU_APP_ID` | 飞书自建应用的 App ID |
| `FEISHU_APP_SECRET` | 飞书自建应用的 App Secret |
| `FEISHU_BITABLE_APP_TOKEN` | 多维表格所属应用的 `app_token` |
| `FEISHU_BITABLE_TABLE_ID` | 具体数据表的 `table_id` |

### 可选环境变量

#### Webhook 通知

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `BOOKING_WEBHOOK_URL` | 机器人 Webhook 地址（写入多维表格后发送通知） | - |
| `BOOKING_WEBHOOK_TYPE` | Webhook 类型：`feishu` 或 `generic` | `feishu` |

#### 自定义字段名

如果你的多维表格列名与默认值不同，可配置以下变量：

| 变量名 | 默认字段名 |
|--------|-----------|
| `FEISHU_FIELD_PLAN` | 套餐 |
| `FEISHU_FIELD_REGION` | 地区 |
| `FEISHU_FIELD_CITY` | 城市 |
| `FEISHU_FIELD_SCHEDULE` | 上门时间 |
| `FEISHU_FIELD_NAME` | 联系人 |
| `FEISHU_FIELD_CONTACT` | 联系方式 |
| `FEISHU_FIELD_NOTES` | 备注 |
| `FEISHU_FIELD_SUBMITTED_AT` | 提交时间 |

#### SEO 配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `PUBLIC_SITE_URL` | 网站正式域名（用于 canonical、sitemap、结构化数据） | `https://your-domain.com` |

> ⚠️ 注意：`PUBLIC_SITE_URL` 不要带结尾 `/`

## 飞书多维表格配置

### 创建字段

在飞书多维表格中创建以下字段：

| 字段名 | 字段类型 |
|--------|----------|
| 套餐 | 单选/文本 |
| 地区 | 单选/文本 |
| 城市 | 文本 |
| 上门时间 | 文本 |
| 联系人 | 文本 |
| 联系方式 | 文本 |
| 备注 | 多行文本 |
| 提交时间 | 日期 |

### 获取必要 Token

1. **App ID / App Secret**：在飞书开放平台创建自建应用获取
2. **app_token**：打开多维表格，URL 中 `base/` 后面的字符串
3. **table_id**：点击具体数据表，URL 中 `table/` 后面的字符串

## Webhook 通知格式

当配置了 `BOOKING_WEBHOOK_URL` 且 `BOOKING_WEBHOOK_TYPE=generic` 时，会发送以下 JSON：

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

## SEO 优化

### 已实现

- ✅ 全局 canonical、Open Graph、Twitter Card
- ✅ 结构化数据：`WebSite`、`Organization`、`WebPage`、`Service`、`FAQPage`
- ✅ `robots.txt`（允许抓取页面，屏蔽 `/api/`）
- ✅ `sitemap.xml`
- ✅ API 响应 `X-Robots-Tag: noindex`
- ✅ `favicon` 与默认社交分享图 `og-image.svg`

### 上线后建议

1. 在 [Google Search Console](https://search.google.com/search-console) 提交 sitemap
2. 在 [Bing Webmaster](https://www.bing.com/webmasters) 提交 sitemap
3. 在百度搜索资源平台提交站点
4. 使用 [Rich Results Test](https://search.google.com/test/rich-results) 验证结构化数据
