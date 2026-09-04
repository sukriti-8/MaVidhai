"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { getOrder, setAuthToken } from "@/lib/api";
import OrderStatus from "@/components/OrderStatus/OrderStatus";
import { useRazorpayPayment } from "@/hooks/useRazorpayPayment";

export default function OrderDetailsPage({ params }) {
  const router = useRouter();
  const orderNumber = params.orderNumber;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const {
    startPayment,
    isProcessing,
    processingMessage,
    error: paymentError,
    isSuccess,
    successMessage
  } = useRazorpayPayment();

  useEffect(() => {
    loadOrder();
  }, [orderNumber]);

  async function loadOrder() {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getOrder(orderNumber);
      setOrder(data);
    } catch (err) {
      if (err.message === "Unauthorized") {
        setAuthToken(null);
        router.push("/login");
      } else if (err.message === "Failed to fetch order") {
        setFetchError(404); // Using 404 to denote missing order
      } else {
        console.error(err);
        setFetchError(500);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleRetryPayment = () => {
    const shippingDetails = {
      shipping_full_name: order.shipping_full_name,
      shipping_email: order.shipping_email,
      shipping_phone: order.shipping_phone,
    };
    startPayment(order.order_number, shippingDetails);
  };

  if (loading && !order) {
    return (
      <main className="min-h-screen bg-[#fffdf8] px-6 py-10 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[900px]">
          <Link href="/orders" className="text-[#d1a11c] hover:text-[#bd8d0f] font-medium mb-6 inline-block">
            &larr; My Orders
          </Link>
          <p className="text-[#a48d69]">Loading your order...</p>
        </div>
      </main>
    );
  }

  if (fetchError === 404) {
    return (
      <main className="min-h-screen bg-[#fffdf8] px-6 py-10 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[900px] text-center py-16">
          <h1 className="text-3xl font-bold text-[#29251f] sm:text-4xl mb-6">Order not found</h1>
          <p className="text-[#756d63] mb-10 max-w-md mx-auto">
            This order doesn't exist or isn't available to your account.
          </p>
          <Link
            href="/orders"
            className="inline-block px-8 py-3 rounded-lg bg-[#d1a11c] text-white font-medium hover:bg-[#bd8d0f] transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  if (fetchError && !order) {
    return (
      <main className="min-h-screen bg-[#fffdf8] px-6 py-10 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[900px]">
          <Link href="/orders" className="text-[#d1a11c] hover:text-[#bd8d0f] font-medium mb-6 inline-block">
            &larr; My Orders
          </Link>
          <div className="rounded-lg bg-red-50 p-6 border border-red-100 text-red-600 text-center mt-6">
            <p className="mb-4">We couldn't load this order.</p>
            <button 
              onClick={loadOrder}
              className="px-6 py-2 rounded-lg bg-[#d1a11c] text-white font-medium hover:bg-[#bd8d0f]"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!order) return null;

  const date = new Date(order.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const showPayNow = order.status === "pending" && order.payment_status !== "captured" && !isSuccess;

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-10 lg:px-10 lg:py-16">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="mx-auto max-w-[900px]">
        <Link href="/orders" className="text-[#d1a11c] hover:text-[#bd8d0f] font-medium mb-8 inline-block">
          &larr; My Orders
        </Link>
        
        {/* Payment Error / Success States */}
        {paymentError && (
          <div className="mb-8 rounded-lg bg-red-50 p-4 border border-red-100 text-red-600">
            {paymentError}
          </div>
        )}
        
        {isSuccess && (
          <div className="mb-8 rounded-lg bg-[#e6f4ea] p-4 border border-[#c3e6cb] text-[#1e8e3e] flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full mb-3 text-xl shadow-sm">
              ✓
            </div>
            <p className="font-medium text-lg mb-1">Payment confirmed</p>
            <p className="text-sm">{successMessage}</p>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl border border-[#eadfca] p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 border-b border-[#eee5d2] pb-6 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#29251f] mb-2">
                Order #{order.order_number}
              </h1>
              <p className="text-[#756d63] mb-4">{date}</p>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#756d63] w-24">Order Status:</span>
                  <OrderStatus status={order.status} />
                </div>
                {order.payment_status && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#756d63] w-24">Payment:</span>
                    <span className="capitalize font-medium text-[#29251f]">{order.payment_status}</span>
                  </div>
                )}
              </div>
            </div>
            
            {showPayNow && (
              <div className="bg-[#fffdf8] border border-[#eadfca] p-4 rounded-lg w-full sm:w-auto text-center">
                <p className="text-sm text-[#756d63] mb-3">Complete payment to confirm your order.</p>
                <button
                  onClick={handleRetryPayment}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-6 py-2 rounded-lg bg-[#d1a11c] text-white font-medium hover:bg-[#bd8d0f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isProcessing ? (processingMessage || "Processing...") : "Pay Now"}
                </button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-semibold text-[#29251f]">Items</h2>
              <div className="space-y-6">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-[#eee5d2] last:border-0 last:pb-0">
                    <div className="mb-2 sm:mb-0">
                      <p className="font-medium text-[#29251f] mb-1">{item.product_name}</p>
                      <p className="text-sm text-[#756d63]">
                        ₹{Number(item.unit_price).toLocaleString("en-IN")} &times; {item.quantity}
                      </p>
                    </div>
                    <div className="text-right font-medium text-[#29251f]">
                      ₹{Number(item.subtotal).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar: Summary & Shipping */}
            <div className="space-y-8 lg:border-l lg:border-[#eee5d2] lg:pl-8">
              <div>
                <h2 className="text-lg font-semibold text-[#29251f] mb-4">Order Summary</h2>
                <div className="space-y-3 text-sm text-[#756d63] border-b border-[#eee5d2] pb-4 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>₹{Number(order.shipping_amount || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span>₹{Number(order.discount_amount || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-lg text-[#29251f]">
                  <span>Total</span>
                  <span className="text-[#a9780d]">₹{Number(order.total_amount).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#29251f] mb-4">Shipping Address</h2>
                <div className="text-sm text-[#756d63] leading-relaxed">
                  <p className="font-medium text-[#29251f] mb-1">{order.shipping_full_name}</p>
                  <p>{order.shipping_phone}</p>
                  <p>{order.shipping_address_line1}</p>
                  {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                  <p>
                    {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
                  </p>
                  <p>{order.shipping_country}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-12 mb-8">
          <Link
            href="/shop"
            className="inline-block px-8 py-3 rounded-lg border-2 border-[#d1a11c] text-[#d1a11c] font-medium hover:bg-[#d1a11c] hover:text-white transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
