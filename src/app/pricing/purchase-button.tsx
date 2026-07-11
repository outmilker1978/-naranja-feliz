"use client";

import { useState } from "react";

export default function PurchaseButton({ planId, price, label }: { planId: string; price: number; label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      }
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={loading} className="btn-gradient w-full py-2.5 text-sm disabled:opacity-50">
        {loading ? "Переход к оплате..." : `Купить за ${price} ₽`}
      </button>
      {error && <p className="text-xs text-red-500 mt-1 text-center">{error}</p>}
    </div>
  );
}
