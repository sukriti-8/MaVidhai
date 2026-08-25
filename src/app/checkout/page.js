"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { getCart, createOrder, setAuthToken } from "@/lib/api";
import { useRazorpayPayment } from "@/hooks/useRazorpayPayment";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  const {
    startPayment,
    isProcessing,
    processingMessage,
    error: paymentError,
    isSuccess,
    successMessage
  } = useRazorpayPayment();

  const [formData, setFormData] = useState({
    shipping_full_name: "",
    shipping_email: "",
    shipping_phone: "",
    shipping_address_line1: "",
    shipping_address_line2: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
    shipping_country: "India",
  });

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    try {
      const data = await getCart();
      if (!data || data.items.length === 0) {
        router.push("/cart");
        return;
      }
      setCart(data);
    } catch (err) {
      if (err.message === "Unauthorized") {
        setAuthToken(null);
        router.push("/login");
      } else {
        console.error(err);
        setInitError("Failed to load checkout details");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInitError(null);

    try {
      // 1. Create Order
      const order = await createOrder(formData);
      
      // 2. Start Payment via Hook
      startPayment(order.order_number, formData);
    } catch (err) {
      console.error(err);
      setInitError(err.message || "Failed to initialize checkout.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffdf8] flex items-center justify-center">
        <p className="text-[#a48d69]">Preparing checkout...</p>
      </main>
    );
  }

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-[#fffdf8] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white rounded-2xl p-8 border border-[#eadfca] shadow-sm">
          <div className="w-16 h-16 bg-[#e6f4ea] text-[#1e8e3e] flex items-center justify-center rounded-full mx-auto mb-6 text-2xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-[#29251f] mb-4">Success</h1>
          <p className="text-[#756d63] leading-relaxed mb-8">{successMessage}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-10 lg:px-10 lg:py-16">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-3xl font-bold text-[#29251f] sm:text-4xl">Checkout</h1>
        
        {(initError || paymentError) && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 border border-red-100 text-red-600">
            {initError || paymentError}
          </div>
        )}

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px]">
          
          {/* SHIPPING FORM */}
          <div className="bg-white p-8 rounded-2xl border border-[#eadfca]">
            <h2 className="text-xl font-semibold text-[#29251f] mb-6">Shipping Address</h2>
            <form id="checkout-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#756d63]">Full Name</label>
                <input
                  type="text"
                  name="shipping_full_name"
                  required
                  value={formData.shipping_full_name}
                  onChange={handleChange}
                  disabled={isProcessing}
                  className="mt-1 block w-full rounded-lg border border-[#e1d7c6] px-4 py-3 outline-none focus:border-[#c99716] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#756d63]">Email</label>
                <input
                  type="email"
                  name="shipping_email"
                  required
                  value={formData.shipping_email}
                  onChange={handleChange}
                  disabled={isProcessing}
                  className="mt-1 block w-full rounded-lg border border-[#e1d7c6] px-4 py-3 outline-none focus:border-[#c99716] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#756d63]">Phone</label>
                <input
                  type="text"
                  name="shipping_phone"
                  required
                  value={formData.shipping_phone}
                  onChange={handleChange}
                  disabled={isProcessing}
                  className="mt-1 block w-full rounded-lg border border-[#e1d7c6] px-4 py-3 outline-none focus:border-[#c99716] disabled:opacity-50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#756d63]">Address Line 1</label>
                <input
                  type="text"
                  name="shipping_address_line1"
                  required
                  value={formData.shipping_address_line1}
                  onChange={handleChange}
                  disabled={isProcessing}
                  className="mt-1 block w-full rounded-lg border border-[#e1d7c6] px-4 py-3 outline-none focus:border-[#c99716] disabled:opacity-50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#756d63]">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  name="shipping_address_line2"
                  value={formData.shipping_address_line2}
                  onChange={handleChange}
                  disabled={isProcessing}
                  className="mt-1 block w-full rounded-lg border border-[#e1d7c6] px-4 py-3 outline-none focus:border-[#c99716] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#756d63]">City</label>
                <input
                  type="text"
                  name="shipping_city"
                  required
                  value={formData.shipping_city}
                  onChange={handleChange}
                  disabled={isProcessing}
                  className="mt-1 block w-full rounded-lg border border-[#e1d7c6] px-4 py-3 outline-none focus:border-[#c99716] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#756d63]">State</label>
                <input
                  type="text"
                  name="shipping_state"
                  required
                  value={formData.shipping_state}
                  onChange={handleChange}
                  disabled={isProcessing}
                  className="mt-1 block w-full rounded-lg border border-[#e1d7c6] px-4 py-3 outline-none focus:border-[#c99716] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#756d63]">Postal Code</label>
                <input
                  type="text"
                  name="shipping_postal_code"
                  required
                  value={formData.shipping_postal_code}
                  onChange={handleChange}
                  disabled={isProcessing}
                  className="mt-1 block w-full rounded-lg border border-[#e1d7c6] px-4 py-3 outline-none focus:border-[#c99716] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#756d63]">Country</label>
                <input
                  type="text"
                  name="shipping_country"
                  required
                  readOnly
                  value={formData.shipping_country}
                  className="mt-1 block w-full rounded-lg border border-[#e1d7c6] px-4 py-3 bg-[#f9f6f0] outline-none text-[#91887c]"
                />
              </div>
            </form>
          </div>

          {/* ORDER SUMMARY */}
          <div className="rounded-2xl border border-[#eadfca] bg-white p-6 sm:p-8 h-fit sticky top-8">
            <h2 className="text-lg font-semibold text-[#29251f]">Order Summary</h2>
            
            <div className="mt-6 flex flex-col gap-4 border-b border-[#eee5d2] pb-6">
              {cart?.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-[#756d63] truncate mr-4">
                    {item.quantity} × {item.product.name}
                  </span>
                  <span className="text-[#29251f] font-medium shrink-0">
                    ₹{Number(item.subtotal).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-b border-[#eee5d2] pb-6">
              <span className="text-[#756d63]">Subtotal</span>
              <span className="font-semibold text-[#29251f]">
                ₹{Number(cart?.subtotal || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="font-semibold text-[#29251f]">Total</span>
              <span className="text-xl font-bold text-[#a9780d]">
                ₹{Number(cart?.subtotal || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={isProcessing}
              className="mt-8 w-full rounded-lg bg-[#d1a11c] py-4 text-sm font-medium text-white transition-all hover:bg-[#bd8d0f] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (processingMessage || "Processing...") : `Pay ₹${Number(cart?.subtotal || 0).toLocaleString("en-IN")}`}
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
