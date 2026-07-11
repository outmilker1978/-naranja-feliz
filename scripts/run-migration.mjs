import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dirname, "../.env.local") });

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

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

try {
  const { data, error } = await svc.rpc("exec_sql", { sql });
  if (error) {
    console.error("RPC error:", JSON.stringify(error));
    process.exit(1);
  }
  console.log("Migration OK:", JSON.stringify(data));
  process.exit(0);
} catch (e) {
  console.error("Failed:", e.message);
  process.exit(1);
}
