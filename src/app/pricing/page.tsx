import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import PurchaseButton from "./purchase-button";

const PLANS = [
  { id: "1m", price: 700, oldPrice: null, label: "1 месяц", perMonth: 700, popular: false },
  { id: "3m", price: 1900, oldPrice: 2100, label: "3 месяца", perMonth: 633, popular: true },
  { id: "6m", price: 3500, oldPrice: 4200, label: "6 месяцев", perMonth: 583, popular: false },
  { id: "12m", price: 6000, oldPrice: 8400, label: "12 месяцев", perMonth: 500, popular: false },
];

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary-50/30">
      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-accent mb-3">Выбери тариф</h1>
          <p className="text-lg text-muted">Получи доступ ко всем курсам и материалам школы</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`card p-6 flex flex-col relative ${plan.popular ? "ring-2 ring-primary-500 shadow-lg" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                  Популярный
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-accent">{plan.label}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-accent">{plan.price} ₽</span>
                  {plan.oldPrice && (
                    <span className="ml-2 text-sm text-muted line-through">{plan.oldPrice} ₽</span>
                  )}
                </div>
                <p className="text-sm text-muted mt-1">{plan.perMonth} ₽/мес</p>
              </div>

              <ul className="space-y-2 mb-6 flex-1 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /> Все курсы школы</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /> Интерактивные задания</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /> Личный словарь</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /> Чат с учителем</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /> Проверка преподавателем</li>
              </ul>

              {user ? (
                <PurchaseButton planId={plan.id} price={plan.price} label={plan.label} />
              ) : (
                <a href="/register" className="btn-gradient text-center py-2.5 text-sm">
                  Начать бесплатно
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
