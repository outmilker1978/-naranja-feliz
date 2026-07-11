const SHOP_ID = process.env.YOO_KASSA_SHOP_ID!;
const SECRET_KEY = process.env.YOO_KASSA_SECRET_KEY!;
const API_URL = "https://api.yookassa.ru/v3";

function authHeader(): string {
  return "Basic " + Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString("base64");
}

function idempotencyKey(): string {
  return crypto.randomUUID();
}

export interface YooKassaPayment {
  id: string;
  status: string;
  confirmation?: { type: string; confirmation_url: string };
}

export async function createPayment(params: {
  amount: number;
  currency?: string;
  description: string;
  returnUrl: string;
}): Promise<YooKassaPayment> {
  const body = {
    amount: { value: params.amount.toFixed(2), currency: params.currency ?? "RUB" },
    confirmation: { type: "redirect", return_url: params.returnUrl },
    capture: true,
    description: params.description,
  };

  const res = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
      "Idempotence-Key": idempotencyKey(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YooKassa createPayment failed: ${res.status} ${err}`);
  }

  return res.json();
}

export async function getPayment(paymentId: string): Promise<YooKassaPayment> {
  const res = await fetch(`${API_URL}/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YooKassa getPayment failed: ${res.status} ${err}`);
  }

  return res.json();
}

export function verifyWebhookIp(ip: string): boolean {
  const allowedIps = [
    "185.71.76.0/27",
    "185.71.77.0/27",
    "77.75.153.0/25",
    "77.75.156.11",
    "77.75.156.35",
    "77.75.154.128/25",
  ];
  return allowedIps.includes(ip) || ip.startsWith("185.71.76.") || ip.startsWith("185.71.77.") || ip.startsWith("77.75.");
}
