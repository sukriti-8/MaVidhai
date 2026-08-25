"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getOrders, setAuthToken } from "@/lib/api";
import OrderCard from "@/components/OrderCard/OrderCard";

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPage = parseInt(searchParams.get("page")) || 1;
  
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    loadOrders(page);
  }, [page]);

  async function loadOrders(pageNumber) {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrders(pageNumber, 20);
      setOrders(data);
    } catch (err) {
      if (err.message === "Unauthorized") {
        setAuthToken(null);
        router.push("/login");
      } else {
        console.error(err);
        setError("We couldn't load your orders.");
      }
    } finally {
      setLoading(false);
    }
  }

  const handlePageChange = (newPage) => {
    setPage(newPage);
    router.push(`/orders?page=${newPage}`, undefined, { shallow: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && !orders) {
    return (
      <main className="min-h-screen bg-[#fffdf8] px-6 py-10 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="text-3xl font-bold text-[#29251f] sm:text-4xl mb-8">My Orders</h1>
          <p className="text-[#a48d69]">Loading your orders...</p>
        </div>
      </main>
    );
  }

  if (error && !orders) {
    return (
      <main className="min-h-screen bg-[#fffdf8] px-6 py-10 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="text-3xl font-bold text-[#29251f] sm:text-4xl mb-8">My Orders</h1>
          <div className="rounded-lg bg-red-50 p-6 border border-red-100 text-red-600 text-center">
            <p className="mb-4">{error}</p>
            <p className="mb-6 text-sm">Please try again.</p>
            <button 
              onClick={() => loadOrders(page)}
              className="px-6 py-2 rounded-lg bg-[#d1a11c] text-white font-medium hover:bg-[#bd8d0f]"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (orders && orders.items.length === 0) {
    return (
      <main className="min-h-screen bg-[#fffdf8] px-6 py-10 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1200px] text-center py-16">
          <h1 className="text-3xl font-bold text-[#29251f] sm:text-4xl mb-6">No orders yet</h1>
          <p className="text-[#756d63] mb-10 max-w-md mx-auto">
            Your purchases will appear here once you place your first order.
          </p>
          <Link
            href="/shop"
            className="inline-block px-8 py-3 rounded-lg bg-[#d1a11c] text-white font-medium hover:bg-[#bd8d0f] transition-colors"
          >
            Explore Shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-10 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-3xl font-bold text-[#29251f] sm:text-4xl mb-2">My Orders</h1>
        <p className="text-[#756d63] mb-10">Your recent purchases</p>
        
        {loading && <p className="text-[#a48d69] mb-4">Loading...</p>}
        {error && <p className="text-red-600 mb-4">{error} <button onClick={() => loadOrders(page)} className="underline">Try Again</button></p>}

        <div className="space-y-4">
          {orders?.items.map((order) => (
            <OrderCard key={order.order_number} order={order} />
          ))}
        </div>

        {orders?.pages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-[#756d63] hover:text-[#29251f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &larr; Previous
            </button>
            <span className="text-sm font-medium text-[#29251f]">
              {page} / {orders.pages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= orders.pages}
              className="px-4 py-2 text-sm font-medium text-[#756d63] hover:text-[#29251f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#fffdf8] px-6 py-10 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="text-3xl font-bold text-[#29251f] sm:text-4xl mb-8">My Orders</h1>
          <p className="text-[#a48d69]">Loading your orders...</p>
        </div>
      </main>
    }>
      <OrdersContent />
    </Suspense>
  );
}
