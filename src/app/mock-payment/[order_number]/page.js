"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { get, post } from "@/lib/api";

export default function MockPaymentPage() {
  const { order_number: orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let active = true;
    get(`/api/orders/${encodeURIComponent(orderNumber)}`)
      .then((data) => { if (active) setOrder(data); })
      .catch((err) => { if (active) setError(err.message || "Could not load this demo order."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderNumber]);

  const completeDemoPayment = async () => {
    setSubmitting(true);
    setError("");
    try {
      await post(`/api/payments/mock-confirm/${encodeURIComponent(orderNumber)}`, {});
      setConfirmed(true);
    } catch (err) {
      setError(err.message || "Could not complete the demo payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffdf8] p-6">
      <section className="w-full max-w-md rounded-2xl border border-[#eadfca] bg-white p-8 text-center shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#a9780d]">VRHAZ local demo</p>
        <h1 className="text-2xl font-bold text-[#29251f]">
          {confirmed ? "Demo payment complete" : "Demo payment"}
        </h1>
        {loading ? (
          <p className="mt-5 text-[#756d63]">Loading order…</p>
        ) : error && !order ? (
          <p role="alert" className="mt-5 text-red-700">{error}</p>
        ) : (
          <>
            <p className="mt-4 text-[#756d63]">Order {orderNumber}</p>
            <p className="mt-2 text-3xl font-bold text-[#a9780d]">₹{Number(order?.total_amount || 0).toLocaleString("en-IN")}</p>
            <p className="mt-4 text-sm text-[#756d63]">
              This local demo confirms the order without charging a card or moving money.
            </p>
            {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
            {confirmed ? (
              <Link href={`/orders/${encodeURIComponent(orderNumber)}`} className="mt-6 inline-flex rounded-lg bg-[#d1a11c] px-5 py-3 text-sm font-semibold text-white">
                View order
              </Link>
            ) : (
              <button type="button" onClick={completeDemoPayment} disabled={submitting || order?.status !== "pending"} className="mt-6 w-full rounded-lg bg-[#d1a11c] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? "Confirming…" : order?.status === "pending" ? "Complete Demo Payment" : `Order ${order?.status || "unavailable"}`}
              </button>
            )}
          </>
        )}
      </section>
    </main>
  );
}
