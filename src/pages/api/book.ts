import type { APIRoute } from "astro";

type BookingPayload = {
  plan: string;
  region: string;
  city: string;
  schedule: string;
  name: string;
  contact: string;
  notes?: string;
};

type RuntimeEnv = {
  BOOKING_WEBHOOK_URL?: string;
  BOOKING_WEBHOOK_TYPE?: "generic" | "feishu";
  FEISHU_APP_ID?: string;
  FEISHU_APP_SECRET?: string;
  FEISHU_BITABLE_APP_TOKEN?: string;
  FEISHU_BITABLE_TABLE_ID?: string;
  FEISHU_FIELD_PLAN?: string;
  FEISHU_FIELD_REGION?: string;
  FEISHU_FIELD_CITY?: string;
  FEISHU_FIELD_SCHEDULE?: string;
  FEISHU_FIELD_NAME?: string;
  FEISHU_FIELD_CONTACT?: string;
  FEISHU_FIELD_NOTES?: string;
  FEISHU_FIELD_SUBMITTED_AT?: string;
};

const planMap: Record<string, string> = {
  standard: "499 上门安装",
  nationwide: "5000 全国可飞",
  bundle: "8999 送 Mac mini"
};

const requiredFields: Array<keyof BookingPayload> = ["plan", "region", "city", "schedule", "name", "contact"];

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });

const formatBookingText = (payload: BookingPayload) =>
  [
    "Openclaw 新预约",
    `套餐：${planMap[payload.plan] ?? payload.plan}`,
    `地区：${payload.region}`,
    `城市：${payload.city}`,
    `时间：${payload.schedule}`,
    `联系人：${payload.name}`,
    `联系方式：${payload.contact}`,
    `备注：${payload.notes?.trim() || "无"}`
  ].join("\n");

const hasFeishuBitableConfig = (env?: RuntimeEnv) =>
  Boolean(env?.FEISHU_APP_ID && env?.FEISHU_APP_SECRET && env?.FEISHU_BITABLE_APP_TOKEN && env?.FEISHU_BITABLE_TABLE_ID);

const getFieldNameMap = (env: RuntimeEnv) => ({
  plan: env.FEISHU_FIELD_PLAN || "套餐",
  region: env.FEISHU_FIELD_REGION || "地区",
  city: env.FEISHU_FIELD_CITY || "城市",
  schedule: env.FEISHU_FIELD_SCHEDULE || "上门时间",
  name: env.FEISHU_FIELD_NAME || "联系人",
  contact: env.FEISHU_FIELD_CONTACT || "联系方式",
  notes: env.FEISHU_FIELD_NOTES || "备注",
  submittedAt: env.FEISHU_FIELD_SUBMITTED_AT || "提交时间"
});

const formatSubmittedAt = () =>
  new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date());

const getFeishuTenantAccessToken = async (env: RuntimeEnv) => {
  const response = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      app_id: env.FEISHU_APP_ID,
      app_secret: env.FEISHU_APP_SECRET
    })
  });

  if (!response.ok) {
    throw new Error(`飞书鉴权失败（${response.status}）`);
  }

  const result = (await response.json()) as {
    code?: number;
    msg?: string;
    tenant_access_token?: string;
  };

  if (result.code !== 0 || !result.tenant_access_token) {
    throw new Error(`飞书鉴权失败：${result.msg || "未知错误"}`);
  }

  return result.tenant_access_token;
};

const createFeishuBitableRecord = async (env: RuntimeEnv, payload: BookingPayload) => {
  const token = await getFeishuTenantAccessToken(env);
  const submittedAt = formatSubmittedAt();
  const fieldNames = getFieldNameMap(env);
  const response = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${env.FEISHU_BITABLE_APP_TOKEN}/tables/${env.FEISHU_BITABLE_TABLE_ID}/records`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: {
          [fieldNames.plan]: planMap[payload.plan] ?? payload.plan,
          [fieldNames.region]: payload.region,
          [fieldNames.city]: payload.city,
          [fieldNames.schedule]: payload.schedule,
          [fieldNames.name]: payload.name,
          [fieldNames.contact]: payload.contact,
          [fieldNames.notes]: payload.notes?.trim() || "",
          [fieldNames.submittedAt]: submittedAt
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`飞书多维表格写入失败（${response.status}）`);
  }

  const result = (await response.json()) as {
    code?: number;
    msg?: string;
    data?: {
      record?: {
        record_id?: string;
      };
    };
  };

  if (result.code !== 0) {
    throw new Error(`飞书多维表格写入失败：${result.msg || "未知错误"}`);
  }

  return result.data?.record?.record_id;
};

const sendWebhookNotification = async (env: RuntimeEnv, payload: BookingPayload) => {
  const webhookUrl = env.BOOKING_WEBHOOK_URL;
  const webhookType = env.BOOKING_WEBHOOK_TYPE ?? "feishu";

  if (!webhookUrl) {
    return;
  }

  const text = formatBookingText(payload);
  const body =
    webhookType === "feishu"
      ? {
          msg_type: "text",
          content: {
            text
          }
        }
      : {
          source: "openclaw-booking",
          submittedAt: new Date().toISOString(),
          planLabel: planMap[payload.plan] ?? payload.plan,
          ...payload,
          text
        };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Webhook 转发失败（${response.status}）`);
  }
};

const readPayload = async (request: Request): Promise<BookingPayload | null> => {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as BookingPayload;
  }

  if (contentType.includes("form")) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries()) as BookingPayload;
  }

  return null;
};

const validatePayload = (payload: BookingPayload) => {
  for (const field of requiredFields) {
    if (!payload[field] || !String(payload[field]).trim()) {
      return `字段缺失：${field}`;
    }
  }

  if (String(payload.contact).trim().length < 5) {
    return "联系方式格式看起来不完整";
  }

  return null;
};

export const POST: APIRoute = async ({ request, locals }) => {
  const payload = await readPayload(request);

  if (!payload) {
    return json(415, { ok: false, message: "仅支持 JSON 或表单提交" });
  }

  const validationError = validatePayload(payload);

  if (validationError) {
    return json(400, { ok: false, message: validationError });
  }

  const runtime = (locals as { runtime?: { env?: RuntimeEnv } }).runtime;
  const env = runtime?.env;

  if (!hasFeishuBitableConfig(env) && !env?.BOOKING_WEBHOOK_URL) {
    return json(500, {
      ok: false,
      message: "缺少飞书多维表格或 webhook 的环境变量配置"
    });
  }

  try {
    let recordId: string | undefined;

    if (env && hasFeishuBitableConfig(env)) {
      recordId = await createFeishuBitableRecord(env, payload);
    }

    if (env) {
      await sendWebhookNotification(env, payload);
    }

    return json(200, {
      ok: true,
      message: "预约已提交",
      recordId
    });
  } catch (error) {
    return json(502, {
      ok: false,
      message: error instanceof Error ? error.message : "预约提交失败"
    });
  }
};
