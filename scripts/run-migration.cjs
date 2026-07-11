const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const sql = `
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  description TEXT,
  yookassa_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'canceled', 'failed')),
  plan_duration_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payment transactions" ON payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can manage payment transactions" ON payment_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_yookassa ON payment_transactions(yookassa_id);
`;

const query = { query: sql };

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(".supabase.co", ".supabase.co");
  const res = await fetch("https://api.supabase.com/v1/projects/zphehhzgbudetyzezunk/database/query", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(query),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("SQL error:", res.status, text);
    process.exit(1);
  }
  console.log("Migration OK:", text);
}
main();
